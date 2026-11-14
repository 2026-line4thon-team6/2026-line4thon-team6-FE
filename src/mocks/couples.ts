import { ApiError } from '@/api/client'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { AuthProvider, AuthTokenResult, OnboardingRequest } from '@/types/auth'
import type { Couple, CoupleConnection, CoupleInvite } from '@/types/couple'
import type { Me, UpdateMeRequest } from '@/types/me'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 커플 · 내 정보 목 서버. 홈 목 데이터(민준 · 민지, D+23)와 맞춘다.
// API 명세 규칙(이름 1~20자, 미래 날짜 불가, 버전 충돌)을 같이 흉내 낸다
const MAX_NAME = 20

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_couple_${++requestCount}`, serverTime: new Date().toISOString() })

const fail = (status: number, code: string, message: string) =>
  new ApiError(status, { error: { code, message, details: [], retryable: false }, meta: meta() })

export const MOCK_ME: Me = {
  id: 'usr_minjun',
  nickname: '민준',
  birthDate: '2003-05-06',
  profileImageUrl: null,
  provider: 'KAKAO',
  onboardingCompleted: true,
  gender: null,
}

export const MOCK_COUPLE: CoupleConnection = {
  connectionStatus: 'CONNECTED',
  couple: {
    id: 'cpl_01',
    status: 'CONNECTED',
    members: [
      { id: 'usr_minjun', nickname: '민준', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
      { id: 'usr_minji', nickname: '민지', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
    ],
    startDate: '2026-10-20',
    daysTogether: 23,
    cumulativeDistanceMeters: 330000,
    completedCardCount: 12,
    version: 1,
    mascotName: '붕붕이',
  },
}

// 연결할 때 쓴 내 코드. 연결 후에는 조회용으로만 남고 새 상대가 쓸 수 없다
const MOCK_INVITE: CoupleInvite = {
  inviteId: 'inv_01',
  code: 'jsd82nk9',
  expiresAt: '2026-11-14T00:00:00Z',
  status: 'CONSUMED',
}

// 목 서버에서 연결에 성공하는 연인(민지)의 코드. 연결 화면을 직접 써 볼 때 입력한다
export const MOCK_PARTNER_INVITE_CODE = 'minji2026'

const MOCK_PARTNER = MOCK_COUPLE.couple!.members[1]
const INVITE_TTL_MS = 24 * 60 * 60 * 1000

let connection: CoupleConnection = structuredClone(MOCK_COUPLE)
let me: Me = structuredClone(MOCK_ME)
let invite: CoupleInvite | null = structuredClone(MOCK_INVITE)
let inviteCount = 1
// 로그인 세션 · 가입할 때 고른 커플 초기값(시작일 · 붕붕이 이름)
let signedIn = true
let coupleDefaults: { startDate: string | null; mascotName: string | null } = { startDate: null, mascotName: null }

// 테스트 · 스토리에서 처음 상태(가입을 마친 민준으로 로그인)로 되돌린다
export function resetMockCouple() {
  connection = structuredClone(MOCK_COUPLE)
  me = structuredClone(MOCK_ME)
  invite = structuredClone(MOCK_INVITE)
  signedIn = true
  coupleDefaults = { startDate: null, mascotName: null }
}

// 서버는 앞뒤 공백 · 대소문자를 무시하고 코드를 비교한다
const sameCode = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function todayIso() {
  const today = startOfToday()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

// 'YYYY-MM-DD'를 기기 날짜(한국 시간) 기준 자정으로 읽는다
function toLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 실제로 있는 날짜이고 오늘 이전인지
function isValidPastDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const value = toLocalDate(date)
  const real = value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day
  return real && value.getTime() <= startOfToday().getTime()
}

// 시작일 당일이 1일
function countDays(startDate: string) {
  return Math.round((startOfToday().getTime() - toLocalDate(startDate).getTime()) / 86_400_000) + 1
}

function getCouple(): Couple {
  if (!connection.couple) throw fail(404, 'COUPLE_NOT_FOUND', '연결된 커플이 없어요.')
  return connection.couple
}

function checkVersion(expected: number, actual: number) {
  if (expected !== actual) throw fail(409, 'VERSION_CONFLICT', '연인이 먼저 정보를 바꿨어요.')
}

function saveCouple(next: Couple): ApiResponse<Couple> {
  connection = { connectionStatus: 'CONNECTED', couple: next }
  return { data: structuredClone(next), meta: meta() }
}

export async function mockFetchMyCouple(): Promise<ApiResponse<CoupleConnection>> {
  return { data: structuredClone(connection), meta: meta() }
}

export async function mockFetchMe(): Promise<ApiResponse<Me>> {
  return { data: structuredClone(me), meta: meta() }
}

export async function mockFetchMyInvite(): Promise<ApiResponse<CoupleInvite>> {
  if (!invite) throw fail(404, 'INVITE_NOT_FOUND', '초대 코드가 없어요.')
  return { data: { ...invite }, meta: meta() }
}

// 본인당 유효 코드 1개 (create-or-get). 연결돼 있으면 발급할 수 없다
export async function mockCreateInvite(): Promise<ApiResponse<CoupleInvite>> {
  if (connection.couple) throw fail(409, 'ALREADY_COUPLED', '이미 연인과 연결되어 있어요.')
  if (invite?.status !== 'ACTIVE') {
    inviteCount += 1
    invite = {
      inviteId: `inv_${String(inviteCount).padStart(2, '0')}`,
      code: `bb${inviteCount}k7m2q`,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
      status: 'ACTIVE',
    }
  }
  return { data: { ...invite }, meta: meta() }
}

// 연인 코드로 연결. 초기값은 코드 발급자(목 연인은 값 없음) → 참가자(가입할 때 고른 값) → 기본값(연결한 날 · 붕붕이) 순서
export async function mockJoinCouple(body: { code: string }): Promise<ApiResponse<Couple>> {
  if (connection.couple) throw fail(409, 'ALREADY_COUPLED', '이미 연인과 연결되어 있어요.')
  if (!body.code.trim()) throw fail(422, 'VALIDATION_FAILED', '연인의 코드를 입력해 주세요.')
  if (invite && sameCode(body.code, invite.code)) throw fail(422, 'SELF_INVITE', '내 코드는 입력할 수 없어요.')
  if (!sameCode(body.code, MOCK_PARTNER_INVITE_CODE)) throw fail(422, 'INVALID_INVITE', '코드를 다시 확인해 주세요.')

  if (invite) invite = { ...invite, status: 'CONSUMED' }
  return saveCouple({
    id: 'cpl_02',
    status: 'CONNECTED',
    members: [
      { id: me.id, nickname: me.nickname, birthDate: me.birthDate, profileImageUrl: me.profileImageUrl, provider: me.provider },
      structuredClone(MOCK_PARTNER),
    ],
    startDate: coupleDefaults.startDate ?? todayIso(),
    daysTogether: countDays(coupleDefaults.startDate ?? todayIso()),
    cumulativeDistanceMeters: 0,
    completedCardCount: 0,
    version: 1,
    mascotName: coupleDefaults.mascotName ?? '붕붕이',
  })
}

export async function mockUpdateStartDate(body: { startDate: string; expectedVersion: number }): Promise<ApiResponse<Couple>> {
  const couple = getCouple()
  checkVersion(body.expectedVersion, couple.version)
  if (!isValidPastDate(body.startDate)) throw fail(422, 'VALIDATION_FAILED', '오늘 이후 날짜는 고를 수 없어요.')

  return saveCouple({
    ...couple,
    startDate: body.startDate,
    daysTogether: countDays(body.startDate),
    version: couple.version + 1,
  })
}

export async function mockRenameMascot(body: { name: string; expectedVersion: number }): Promise<ApiResponse<Couple>> {
  const couple = getCouple()
  checkVersion(body.expectedVersion, couple.version)
  const name = body.name.trim()
  if (!name || name.length > MAX_NAME) throw fail(422, 'VALIDATION_FAILED', '붕붕이명은 1~20자로 입력해 주세요.')

  return saveCouple({ ...couple, mascotName: name, version: couple.version + 1 })
}

export async function mockUpdateMe(body: UpdateMeRequest): Promise<ApiResponse<Me>> {
  const next = { ...me }
  if (body.nickname !== undefined) {
    const nickname = body.nickname.trim()
    if (!nickname || nickname.length > MAX_NAME) throw fail(422, 'VALIDATION_FAILED', '닉네임은 1~20자로 입력해 주세요.')
    next.nickname = nickname
  }
  if (body.birthDate !== undefined) {
    if (body.birthDate !== null && !isValidPastDate(body.birthDate)) {
      throw fail(422, 'VALIDATION_FAILED', '생년월일을 다시 확인해 주세요.')
    }
    next.birthDate = body.birthDate
  }
  me = next

  // 다음 조회부터 커플 멤버 정보에도 반영된다
  if (connection.couple) {
    connection = {
      ...connection,
      couple: {
        ...connection.couple,
        members: connection.couple.members.map((member) =>
          member.id === me.id ? { ...member, nickname: me.nickname, birthDate: me.birthDate } : member,
        ),
      },
    }
  }
  return { data: structuredClone(me), meta: meta() }
}

export async function mockDisconnectCouple(): Promise<void> {
  getCouple()
  connection = { couple: null, connectionStatus: 'DISCONNECTED' }
  // 연결에 썼던 코드는 새 상대가 쓸 수 없으니 새로 발급받아야 한다
  invite = null
}

// ── 로그인 · 가입 (POST /auth/token · POST /auth/logout · PUT /me/onboarding) ──

// 확정 정책 D09: access token 30분, refresh token 14일
const MOCK_TOKEN_TTL = { access: 30 * 60, refresh: 14 * 24 * 60 * 60 }

// 목 서버에서는 로그아웃하면 다음 로그인이 아직 가입하지 않은 새 사용자가 된다. 가입 화면 흐름을 직접 써 볼 수 있게
function startNewAccount() {
  me = { id: 'usr_new', nickname: '', birthDate: null, profileImageUrl: null, provider: 'KAKAO', onboardingCompleted: false, gender: null }
  connection = { couple: null, connectionStatus: 'UNLINKED' }
  invite = null
  coupleDefaults = { startDate: null, mascotName: null }
}

// 카카오 인증을 마친 것으로 보고 서비스 토큰을 발급한다
export async function mockLogin(provider: AuthProvider): Promise<ApiResponse<AuthTokenResult>> {
  void provider
  signedIn = true
  return {
    data: {
      accessToken: 'mock_access_token',
      accessTokenExpiresInSeconds: MOCK_TOKEN_TTL.access,
      refreshToken: 'mock_refresh_token',
      refreshTokenExpiresInSeconds: MOCK_TOKEN_TTL.refresh,
      tokenType: 'Bearer',
      user: structuredClone(me),
      isNewUser: !me.onboardingCompleted,
    },
    meta: meta(),
  }
}

export async function mockLogout(): Promise<void> {
  signedIn = false
  startNewAccount()
}

// 계정은 그대로 두고 세션만 끊는다 (앱 데이터를 지운 기기에서 기존 가입자가 다시 로그인하는 경우를 흉내 낸다)
export function mockEndSession() {
  signedIn = false
}

// 앱을 열 때 화면을 바로 정하기 위한 동기 확인 (실서버의 '기기에 토큰이 있는지'에 해당)
export function mockHasSession() {
  return signedIn
}

// 앱을 다시 열었을 때 저장된 세션으로 내 계정을 불러온다 (GET /me)
export async function mockRestoreSession(): Promise<ApiResponse<Me>> {
  if (!signedIn) throw fail(401, 'AUTHENTICATION_REQUIRED', '로그인이 필요해요.')
  return mockFetchMe()
}

export async function mockCompleteOnboarding(body: OnboardingRequest): Promise<ApiResponse<Me>> {
  const nickname = body.nickname.trim()
  if (!nickname || nickname.length > MAX_NAME) throw fail(422, 'VALIDATION_FAILED', '닉네임은 1~20자로 입력해 주세요.')
  const agreed = (type: string) => body.consents.some((consent) => consent.type === type && consent.agreed)
  if (!agreed('TERMS') || !agreed('PRIVACY')) {
    throw fail(422, 'REQUIRED_CONSENT_MISSING', '이용약관과 개인정보 처리방침에 동의해 주세요.')
  }
  if (body.birthDate !== null && !isValidPastDate(body.birthDate)) {
    throw fail(422, 'INVALID_BIRTH_DATE', '생일을 다시 확인해 주세요.')
  }
  if (body.coupleStartDate && !isValidPastDate(body.coupleStartDate)) {
    throw fail(422, 'VALIDATION_FAILED', '만난 날을 다시 확인해 주세요.')
  }

  me = { ...me, nickname, birthDate: body.birthDate, gender: body.gender ?? null, onboardingCompleted: true }
  coupleDefaults = { startDate: body.coupleStartDate ?? null, mascotName: body.mascotName?.trim() || null }
  return { data: structuredClone(me), meta: meta() }
}
