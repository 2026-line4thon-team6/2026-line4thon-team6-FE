import { mockCompleteOnboarding, mockHasSession, mockLogin, mockLogout, mockRestoreSession } from '@/mocks/couples'
import type { ApiResponse } from '@/types/api'
import type { AuthAuthorization, AuthProvider, AuthRefreshResult, AuthTokenResult, OnboardingRequest } from '@/types/auth'
import type { Me } from '@/types/me'
import { createCodeChallenge, createCodeVerifier } from '@/utils/pkce'
import { createIdempotencyKey } from '@/utils/share'
import { ApiError, apiFetch, isAccessTokenExpired, setAccessToken, setTokenRefresher, USE_MOCK } from './client'

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

function saveTokens(result: AuthRefreshResult) {
  write(local, TOKEN_KEY, { accessToken: result.accessToken, refreshToken: result.refreshToken })
  setAccessToken(result.accessToken)
}

function clearTokens() {
  write(local, TOKEN_KEY, null)
  setAccessToken(null)
}

// 저장된 토큰. 백엔드 연결 전 목 모드에서 저장된 토큰(mock_)은 실서버에서 쓸 수 없으므로 지우고 없는 것으로 본다
function readTokens(): StoredTokens | null {
  const tokens = read<StoredTokens>(local, TOKEN_KEY)
  if (!USE_MOCK && tokens?.accessToken.startsWith('mock_')) {
    clearTokens()
    return null
  }
  return tokens
}

// 리프레시 토큰까지 만료되거나 무효가 되어 세션이 끊겼을 때 앱에 알린다 (로그인 화면으로 보낸다)
const sessionExpiredListeners = new Set<() => void>()

export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

function expireSession() {
  clearTokens()
  sessionExpiredListeners.forEach((listener) => listener())
}

// POST /auth/refresh — 저장된 리프레시 토큰으로 새 토큰 쌍을 받는다. 서버가 리프레시 토큰을 회전시키므로 둘 다 저장한다.
// 리프레시 토큰이 만료 · 재사용(401)되면 세션을 끝낸다. 네트워크 오류 · 503 등은 세션을 남겨 두고 다음 요청에서 다시 시도한다
async function refreshTokens(expiredToken: string): Promise<string> {
  const tokens = readTokens()
  if (!tokens) {
    expireSession()
    throw new ApiError(401, null)
  }
  // 다른 탭이 이미 갱신했으면 저장된 새 토큰을 쓴다. 회전된 리프레시 토큰을 다시 쓰면 서버가 세션 전체를 끊는다
  if (tokens.accessToken !== expiredToken) {
    setAccessToken(tokens.accessToken)
    return tokens.accessToken
  }

  try {
    const { data } = await apiFetch<AuthRefreshResult>('/auth/refresh', {
      method: 'POST',
      headers: { 'Idempotency-Key': await refreshIdempotencyKey(tokens.refreshToken) },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })
    saveTokens(data)
    return data.accessToken
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) expireSession()
    throw error
  }
}

if (!USE_MOCK) setTokenRefresher(refreshTokens)

// 로그아웃할 때 현재 기기만 끊기 위한 기기 id
function getDeviceId() {
  const saved = read<string>(local, DEVICE_KEY)
  if (saved) return saved
  const id = crypto.randomUUID()
  write(local, DEVICE_KEY, id)
  return id
}

// 같은 리프레시 토큰이면 언제나 같은 키를 만든다. 응답을 못 받고 다시 보내거나 다른 탭이 동시에 갱신해도
// 서버가 30초 안의 같은 키 요청에는 앞선 결과를 돌려준다 (다른 키로 옛 토큰을 다시 쓰면 세션 전체가 끊긴다)
async function refreshIdempotencyKey(refreshToken: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(new TextEncoder().encode(refreshToken)))
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `refresh-${hex}`
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
    headers: { 'Idempotency-Key': createIdempotencyKey() },
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
  return USE_MOCK ? mockHasSession() : readTokens() !== null
}

// 앱을 열 때 한 번 부른다. 저장된 세션이 있으면 액세스 토큰을 바로 실어 두고 true를 돌려준다.
// React는 자식 화면의 effect(홈 · 진행 중 드라이브 조회 등)를 App의 세션 복구보다 먼저 실행하므로,
// 토큰을 미리 실어 두지 않으면 첫 요청들이 토큰 없이 나가 401을 받는다
export function loadStoredSession(): boolean {
  if (USE_MOCK) return mockHasSession()
  const tokens = readTokens()
  if (tokens) setAccessToken(tokens.accessToken)
  return tokens !== null
}

// 앱을 열 때 저장된 세션으로 내 계정을 불러온다. 세션이 없거나 만료됐으면 null
// 액세스 토큰이 만료됐으면 apiFetch가 리프레시 토큰으로 갱신해 다시 불러온다
export async function restoreSession(): Promise<Me | null> {
  try {
    if (USE_MOCK) return (await mockRestoreSession()).data

    const tokens = readTokens()
    if (!tokens) return null
    setAccessToken(tokens.accessToken)
    return (await apiFetch<Me>('/me')).data
  } catch (error) {
    // 계정이 없어졌으면(탈퇴 등) 저장된 세션은 쓸 수 없다
    if (error instanceof ApiError && error.status === 404) {
      clearTokens()
      return null
    }
    if (error instanceof ApiError && error.status === 401) {
      // 갱신이 일시 장애(503 · 네트워크)로 실패해 세션이 남아 있으면 지우지 않고 오류를 던진다 (다음에 다시 시도)
      if (isAccessTokenExpired(error) && hasStoredSession()) throw error
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
    const tokens = readTokens()
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
