import type { ApiErrorDetail, ApiErrorResponse, ApiResponse } from '@/types/api'

// 백엔드 주소. 예) https://api.example.com/api/v1
// 값이 없거나 서버가 응답하지 않으면(USE_MOCK) 각 API 함수가 src/mocks 의 목 데이터로 응답한다
const BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL

// let으로 내보내 detectBackend의 결과가 이 값을 가져다 쓰는 모든 모듈에 반영된다
export let USE_MOCK = !BASE_URL

const HEALTH_TIMEOUT_MS = 3000

// 앱 시작 때 한 번 GET /health 로 서버가 떠 있는지 확인한다. 꺼져 있거나 늦으면 앱 전체를 목 데이터로 돌린다.
// 요청마다 따로 대체하면 실서버 데이터와 목 데이터가 섞이므로 시작할 때 한 번만 정한다
export async function detectBackend(): Promise<void> {
  if (!BASE_URL) return

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const response = await fetch(`${BASE_URL}/health`, { headers: { Accept: 'application/json' }, signal: controller.signal })
    USE_MOCK = !response.ok
  } catch {
    USE_MOCK = true
  } finally {
    clearTimeout(timer)
  }
  if (USE_MOCK) console.warn(`[api] ${BASE_URL} 서버가 응답하지 않아 목 데이터로 보여 줍니다.`)
}

// 서비스 액세스 토큰 (Bearer JWT). 로그인 연동 시 setAccessToken으로 넣는다
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

// 액세스 토큰을 새로 받아 오는 방법. 토큰 저장소를 가진 auth 모듈이 등록한다 (client → auth 순환 import를 피한다)
// 401을 받은 토큰을 받아 새 액세스 토큰을 돌려주고, 갱신하지 못하면 오류를 던진다
type TokenRefresher = (expiredToken: string) => Promise<string>
let refresher: TokenRefresher | null = null

export function setTokenRefresher(refresh: TokenRefresher | null) {
  refresher = refresh
}

// 동시에 여러 요청이 401을 받아도 갱신은 한 번만 한다. 서버가 리프레시 토큰을 회전시키고
// 이미 쓴 리프레시 토큰을 다시 쓰면 세션 전체를 끊으므로(REFRESH_TOKEN_REUSED) 반드시 하나로 묶는다
let refreshing: Promise<string> | null = null

function refreshAccessToken(refresh: TokenRefresher, expiredToken: string) {
  refreshing ??= refresh(expiredToken).finally(() => {
    refreshing = null
  })
  return refreshing
}

// 액세스 토큰 만료로 볼 401 코드. 만료 토큰에 ACCESS_TOKEN_EXPIRED 대신 AUTHENTICATION_REQUIRED를 주는 경로도 있다.
// REAUTH_REQUIRED 등은 토큰을 갱신해도 풀리지 않는다
const REFRESHABLE_CODES = ['ACCESS_TOKEN_EXPIRED', 'AUTHENTICATION_REQUIRED']

export function isAccessTokenExpired(error: ApiError) {
  return error.status === 401 && REFRESHABLE_CODES.includes(error.code)
}

// 갱신 요청 자체와 로그인 · 로그아웃 요청의 401은 갱신하지 않는다 (갱신 무한 반복 방지).
// 재인증(/auth/reauth*)은 액세스 토큰이 필요한 요청이라 만료되면 갱신한다
const NON_REFRESHABLE_PATHS = ['/auth/refresh', '/auth/token', '/auth/authorizations', '/auth/logout']

function canRefresh(path: string, status: number, body: Partial<ApiErrorResponse> | null) {
  const route = path.split('?')[0]
  return status === 401 && !NON_REFRESHABLE_PATHS.includes(route) && REFRESHABLE_CODES.includes(body?.error?.code ?? '')
}

// 오류 응답 { error, meta } 를 그대로 담는다. 화면에서는 retryable로 재시도 가능 여부를 판단한다
export class ApiError extends Error {
  status: number
  code: string
  retryable: boolean
  details: ApiErrorDetail['details']
  requestId: string | null

  constructor(status: number, body: Partial<ApiErrorResponse> | null) {
    super(body?.error?.message ?? `요청에 실패했어요. (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.error?.code ?? 'UNKNOWN'
    this.retryable = body?.error?.retryable ?? status >= 500
    this.details = body?.error?.details ?? []
    this.requestId = body?.meta?.requestId ?? null
  }
}

async function send(path: string, init: RequestInit, token: string | null) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  const body = await response.json().catch(() => null)
  return { response, body }
}

// 성공하면 { data, meta } 를 돌려주고, 실패하면 ApiError를 던진다. 본문이 없는 204는 null을 돌려준다
// 토큰을 실어 보낸 요청이 액세스 토큰 만료로 401이면 토큰을 갱신하고 한 번만 다시 보낸다
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const sentToken = accessToken
  let { response, body } = await send(path, init, sentToken)

  if (sentToken && refresher && canRefresh(path, response.status, body)) {
    // 기다리는 사이 다른 요청이 이미 갱신했으면 그 토큰으로 바로 다시 보낸다
    const token =
      accessToken && accessToken !== sentToken
        ? accessToken
        : await refreshAccessToken(refresher, sentToken).catch(() => null)
    if (token) ({ response, body } = await send(path, init, token))
  }

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body as ApiResponse<T>
}
