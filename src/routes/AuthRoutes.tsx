import { type ReactNode, useEffect, useRef, useState, ViewTransition } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router'
import { clearPendingAuth, completeReauth, completeSocialLogin, deleteAccount, login, pendingAuthPurpose } from '@/api/auth'
import type { Auth } from '@/hooks/useAuth'
import useOnboarding, { type Onboarding } from '@/hooks/useOnboarding'
import LoginPage from '@/pages/Login/LoginPage'
import DateStepPage from '@/pages/Onboarding/DateStepPage'
import GenderStepPage from '@/pages/Onboarding/GenderStepPage'
import IntroPage from '@/pages/Onboarding/IntroPage'
import NameStepPage from '@/pages/Onboarding/NameStepPage'
import WelcomePage from '@/pages/Onboarding/WelcomePage'
import type { ConsentType } from '@/types/auth'
import type { Me } from '@/types/me'
import { LOGIN_PATH, MY_PATH, ONBOARDING_PATHS } from './paths'
import { LOGIN_ERROR, loginErrorMessage } from '@/utils/loginError'
import { WITHDRAW_CANCELLED, WITHDRAWN_NOTICE, withdrawErrorMessage } from '@/utils/withdrawError'

const INVITE_PATH = '/couple/invite'

// 가입 질문 중 약관 문서를 보러 갈 때의 주소 (로그인 전에도 볼 수 있는 공개 화면)
const DOCUMENT_PATHS: Record<ConsentType, string> = { TERMS: '/my/terms', PRIVACY: '/my/privacy' }

// 로그인을 마친 뒤 갈 곳: 가입을 마쳤으면 메인 홈, 아니면 가입 질문
const homeOf = (user: Me) => (user.onboardingCompleted ? '/' : ONBOARDING_PATHS.welcome)

interface AuthRouteProps {
  auth: Auth
}

// 로그인 · 가입을 마친 사용자만 들어오는 화면들. 로그인 전이면 L1, 가입 전이면 L2로 보낸다
export function MemberGate({ auth }: AuthRouteProps) {
  if (auth.status === 'signedOut') return <Navigate to={LOGIN_PATH} replace />
  if (auth.user && !auth.user.onboardingCompleted) return <Navigate to={ONBOARDING_PATHS.welcome} replace />
  return <Outlet />
}

interface GuestOrMemberGateProps extends AuthRouteProps {
  // 로그인 전 사용자에게 대신 보여 줄 공개 화면
  guest: ReactNode
}

// 로그인 없이도 열려야 하는 공유 링크 주소(예: /places/:placeId)에 쓴다.
// 주소를 바꾸면 이미 퍼진 공유 링크가 깨지므로, 같은 주소에서 로그인 전이면 공개 화면을 그리고
// 로그인했으면 MemberGate와 같은 규칙(가입 전이면 가입 질문으로)으로 회원 화면을 그린다
export function GuestOrMemberGate({ auth, guest }: GuestOrMemberGateProps) {
  if (auth.status === 'signedOut') return guest
  return <MemberGate auth={auth} />
}

// L1 로그인 메인. 이미 로그인했으면 들어오지 않는다
export function LoginRoute({ auth }: AuthRouteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  // 카카오 로그인 화면에서 실패하고 돌아온 경우 (OAuthCallbackRoute가 넘긴다)
  const [error, setError] = useState<string | null>((location.state as { error?: string } | null)?.error ?? null)
  // 탈퇴를 마치고 온 경우 (OAuthCallbackRoute가 넘긴다)
  const notice = (location.state as { notice?: string } | null)?.notice ?? null

  if (auth.status === 'signedIn' && status === 'idle') {
    return <Navigate to={auth.user ? homeOf(auth.user) : '/'} replace />
  }

  const handleLogin = async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await login('KAKAO')
      // null이면 카카오 로그인 화면으로 이동하는 중이다
      if (!result) return
      auth.signIn(result.user)
      navigate(homeOf(result.user), { replace: true })
    } catch (error) {
      setError(loginErrorMessage(error))
      setStatus('idle')
    }
  }

  return <LoginPage status={status} error={error} notice={notice} onKakaoLogin={() => void handleLogin()} />
}

// 카카오 로그인 화면에서 돌아오는 주소 (redirectUri). 코드를 서비스 토큰으로 바꾸고 다음 화면으로 보낸다
export function OAuthCallbackRoute({ auth }: AuthRouteProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // StrictMode에서 두 번 실행돼도 OAuth 코드는 한 번만 쓴다 (코드는 1회용)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const code = params.get('code')
    const state = params.get('state')

    // 회원 탈퇴 전 본인 재인증에서 돌아왔으면 로그인이 아니라 탈퇴를 마무리한다 (같은 콜백 주소)
    if (pendingAuthPurpose() === 'REAUTH') {
      if (!code || !state) {
        clearPendingAuth()
        navigate(MY_PATH, { replace: true, state: { withdrawError: WITHDRAW_CANCELLED } })
        return
      }
      completeReauth({ code, state })
        .then(deleteAccount)
        .then(async () => {
          await auth.signOut()
          navigate(LOGIN_PATH, { replace: true, state: { notice: WITHDRAWN_NOTICE } })
        })
        .catch((error: unknown) => navigate(MY_PATH, { replace: true, state: { withdrawError: withdrawErrorMessage(error) } }))
      return
    }

    if (!code || !state) {
      navigate(LOGIN_PATH, { replace: true, state: { error: LOGIN_ERROR } })
      return
    }

    completeSocialLogin({ code, state })
      .then((result) => {
        auth.signIn(result.user)
        navigate(homeOf(result.user), { replace: true })
      })
      .catch((error: unknown) => navigate(LOGIN_PATH, { replace: true, state: { error: loginErrorMessage(error) } }))
  }, [auth, navigate, params])

  return null
}

// ── 가입 질문 (L2~L8) ──

interface FlowContext {
  onboarding: Onboarding
  // 가입 정보를 저장한 뒤 연인 초대(L9)로 넘어간다
  finish: (user: Me) => void
}

// 가입 질문 화면들의 공통 부모. 답변을 모아 두고, 로그인 전 · 가입 후에는 들어오지 않는다
export function OnboardingFlow({ auth }: AuthRouteProps) {
  const onboarding = useOnboarding()
  const navigate = useNavigate()
  // 방금 가입을 마쳤으면 메인 홈 대신 연인 초대로 보낸다. 화면 이동(transition)보다 로그인 상태 갱신이 먼저 그려지기 때문
  const [finished, setFinished] = useState(false)

  const finish = (user: Me) => {
    setFinished(true)
    auth.signIn(user)
    navigate(INVITE_PATH, { replace: true })
  }

  if (auth.status === 'signedOut') return <Navigate to={LOGIN_PATH} replace />
  if (auth.user?.onboardingCompleted && !finished) return <Navigate to="/" replace />
  // 단계가 바뀌면 새 화면이 오른쪽에서 밀려 들어온다 (styles/base/_view-transitions.scss).
  // 뒤로 가기(popstate)는 React가 전환 없이 바로 그린다
  return (
    <ViewTransition update="onboarding-page" default="none">
      <div>
        <Outlet context={{ onboarding, finish } satisfies FlowContext} />
      </div>
    </ViewTransition>
  )
}

function useFlow() {
  const context = useOutletContext<FlowContext>()
  const navigate = useNavigate()
  const location = useLocation()
  // 주소로 바로 들어왔으면(이전 기록 없음) fallback 단계로 돌아간다
  const back = (fallback: string) => () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
  return { ...context, navigate, back }
}

export function WelcomeStep() {
  const { onboarding, navigate } = useFlow()

  return (
    <WelcomePage
      agreed={onboarding.draft.agreed}
      onAgreeChange={(agreed) => onboarding.update({ agreed })}
      onNext={() => navigate(ONBOARDING_PATHS.intro)}
      onOpenDocument={(type) => navigate(DOCUMENT_PATHS[type])}
    />
  )
}

export function IntroStep() {
  const { navigate } = useFlow()
  return <IntroPage onNext={() => navigate(ONBOARDING_PATHS.nickname)} />
}

export function NicknameStep() {
  const { onboarding, navigate, back } = useFlow()

  return (
    <NameStepPage
      title="이름 입력"
      question="제가 뭐라고 불러드릴까요?"
      label="닉네임"
      value={onboarding.draft.nickname}
      onChange={(nickname) => onboarding.update({ nickname })}
      onBack={back(ONBOARDING_PATHS.intro)}
      onNext={() => navigate(ONBOARDING_PATHS.birthday)}
    />
  )
}

export function BirthdayStep() {
  const { onboarding, navigate, back } = useFlow()

  return (
    <DateStepPage
      title="생년월일 입력"
      question="생일이 언제신가요?"
      label="생일"
      value={onboarding.draft.birthDate}
      onChange={(birthDate) => onboarding.update({ birthDate })}
      onBack={back(ONBOARDING_PATHS.nickname)}
      onNext={() => navigate(ONBOARDING_PATHS.gender)}
    />
  )
}

export function GenderStep() {
  const { onboarding, navigate, back } = useFlow()

  return (
    <GenderStepPage
      value={onboarding.draft.gender}
      onChange={(gender) => onboarding.update({ gender })}
      onBack={back(ONBOARDING_PATHS.birthday)}
      onNext={() => navigate(ONBOARDING_PATHS.anniversary)}
    />
  )
}

// 건너뛰면 시작일 없이 저장하고, 연인과 연결한 날을 D+1로 센다
export function AnniversaryStep() {
  const { onboarding, navigate, back } = useFlow()

  return (
    <DateStepPage
      title="기념일 입력"
      question="연인과 언제부터 만났나요?"
      label="만난 날"
      value={onboarding.draft.coupleStartDate}
      onChange={(coupleStartDate) => onboarding.update({ coupleStartDate })}
      onBack={back(ONBOARDING_PATHS.gender)}
      onNext={() => navigate(ONBOARDING_PATHS.mascot)}
      onSkip={() => {
        onboarding.update({ coupleStartDate: '' })
        navigate(ONBOARDING_PATHS.mascot)
      }}
    />
  )
}

// 마지막 질문. 다음을 누르면 가입 정보를 저장하고 연인 초대(L9)로 간다
export function MascotStep() {
  const { onboarding, finish, back } = useFlow()

  const handleNext = async (mascotName: string) => {
    const user = await onboarding.submit(mascotName)
    if (user) finish(user)
  }

  return (
    <NameStepPage
      title="붕붕이명 입력"
      question={'붕붕어스와 함께할\n붕붕이의 이름을 입력해주세요.'}
      label="붕붕이 이름"
      value={onboarding.draft.mascotName}
      onChange={(mascotName) => onboarding.update({ mascotName })}
      onBack={back(ONBOARDING_PATHS.anniversary)}
      onNext={(name) => void handleNext(name)}
      submitting={onboarding.submitting}
      error={onboarding.error}
    />
  )
}
