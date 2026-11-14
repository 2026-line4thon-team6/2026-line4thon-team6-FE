import { mockCompleteOnboarding, mockHasSession, mockLogin, mockLogout, mockRestoreSession } from '@/mocks/couples'
import type { ApiResponse } from '@/types/api'
import type { AuthAuthorization, AuthProvider, AuthTokenResult, OnboardingRequest } from '@/types/auth'
import type { Me } from '@/types/me'
import { createCodeChallenge, createCodeVerifier } from '@/utils/pkce'
import { ApiError, apiFetch, setAccessToken, USE_MOCK } from './client'

// 기기에 남겨 두는 서비스 토큰. 로그아웃하지 않으면 계속 로그인 상태를 유지한다 (기능명세서 L1)
const TOKEN_KEY = 'bbus.auth'
// 카카오 로그인 화면에 다녀오는 동안만 보관하는 PKCE 세션
const PENDING_KEY = 'bbus.auth.pending'
const DEVICE_KEY = 'bbus.device'

interface StoredTokens {
  accessToken: string
  refreshToken: string
}

interface PendingLogin {
  authSessionId: string
  state: string
  codeVerifier: string
}

// 사생활 보호 모드 등에서 저장소 접근이 막혀도 앱은 동작해야 한다
function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const value = storage().getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key)
    else storage().setItem(key, JSON.stringify(value))
  } catch {
    // 저장하지 못하면 이번 실행 동안만 로그인 상태를 유지한다
  }
}

const local = () => localStorage
const session = () => sessionStorage

function saveTokens(result: AuthTokenResult) {
  write(local, TOKEN_KEY, { accessToken: result.accessToken, refreshToken: result.refreshToken })
  setAccessToken(result.accessToken)
}

function clearTokens() {
  write(local, TOKEN_KEY, null)
  setAccessToken(null)
}

// 로그아웃할 때 현재 기기만 끊기 위한 기기 id
function getDeviceId() {
  const saved = read<string>(local, DEVICE_KEY)
  if (saved) return saved
  const id = crypto.randomUUID()
  write(local, DEVICE_KEY, id)
  return id
}

// POST /auth/authorizations — 로그인 세션을 만들고 공급자 로그인 화면 주소를 돌려준다 (PKCE S256)
export async function startSocialLogin(provider: AuthProvider, redirectUri: string): Promise<string> {
  const codeVerifier = createCodeVerifier()
  const { data } = await apiFetch<AuthAuthorization>('/auth/authorizations', {
    method: 'POST',
    body: JSON.stringify({ provider, redirectUri, codeChallenge: await createCodeChallenge(codeVerifier), purpose: 'LOGIN' }),
  })
  write(session, PENDING_KEY, { authSessionId: data.authSessionId, state: data.state, codeVerifier } satisfies PendingLogin)
  return data.authorizationUrl
}

// POST /auth/token — 공급자 로그인 화면에서 돌아온 코드를 서비스 토큰으로 바꾼다. state가 다르면 교환하지 않는다
export async function completeSocialLogin({ code, state }: { code: string; state: string }): Promise<AuthTokenResult> {
  const pending = read<PendingLogin>(session, PENDING_KEY)
  write(session, PENDING_KEY, null)
  if (!pending || pending.state !== state) {
    throw new ApiError(400, { error: { code: 'OAUTH_STATE_MISMATCH', message: '로그인을 다시 시도해 주세요.', details: [], retryable: false } })
  }

  const { data } = await apiFetch<AuthTokenResult>('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ authSessionId: pending.authSessionId, authorizationCode: code, state, codeVerifier: pending.codeVerifier }),
  })
  saveTokens(data)
  return data
}

// 로그인 버튼. 목 서버는 바로 로그인 결과를, 실서버는 공급자 로그인 화면으로 이동하고 null을 돌려준다
export async function login(provider: AuthProvider): Promise<AuthTokenResult | null> {
  if (USE_MOCK) {
    const { data } = await mockLogin(provider)
    saveTokens(data)
    return data
  }

  window.location.assign(await startSocialLogin(provider, `${window.location.origin}/oauth/callback`))
  return null
}

// 기기에 로그인 세션이 남아 있는지. 첫 화면을 로그인 화면으로 보낼지 바로 정할 때 쓴다
export function hasStoredSession() {
  return USE_MOCK ? mockHasSession() : read<StoredTokens>(local, TOKEN_KEY) !== null
}

// 앱을 열 때 저장된 세션으로 내 계정을 불러온다. 세션이 없거나 만료됐으면 null
// TODO: 액세스 토큰 만료(ACCESS_TOKEN_EXPIRED) 시 POST /auth/refresh로 갱신한다
export async function restoreSession(): Promise<Me | null> {
  try {
    if (USE_MOCK) return (await mockRestoreSession()).data

    const tokens = read<StoredTokens>(local, TOKEN_KEY)
    if (!tokens) return null
    setAccessToken(tokens.accessToken)
    return (await apiFetch<Me>('/me')).data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearTokens()
      return null
    }
    throw error
  }
}

// POST /auth/logout — 현재 기기만 로그아웃한다. 서버 요청이 실패해도 기기의 토큰은 지운다.
export async function logout(idempotencyKey: string): Promise<void> {
  try {
    if (USE_MOCK) {
      await mockLogout()
      return
    }
    const tokens = read<StoredTokens>(local, TOKEN_KEY)
    if (tokens) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ refreshToken: tokens.refreshToken, deviceId: getDeviceId() }),
      })
    }
  } finally {
    clearTokens()
  }
}

// PUT /me/onboarding — 가입 프로필 · 필수 동의를 한 번에 저장한다
export function completeOnboarding(body: OnboardingRequest): Promise<ApiResponse<Me>> {
  if (USE_MOCK) return mockCompleteOnboarding(body)

  return apiFetch<Me>('/me/onboarding', { method: 'PUT', body: JSON.stringify(body) })
}
