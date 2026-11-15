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

// 성공하면 { data, meta } 를 돌려주고, 실패하면 ApiError를 던진다. 본문이 없는 204는 null을 돌려준다
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body as ApiResponse<T>
}
