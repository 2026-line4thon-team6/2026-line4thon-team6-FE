import { ApiError } from '@/api/client'

export const LOGIN_ERROR = '로그인하지 못했어요. 다시 시도해 주세요.'

// 서버 설정 문제(허용되지 않은 콜백 주소 · 꺼진 로그인 수단)라 사용자가 다시 시도해도 바로 풀리지 않는다
const UNAVAILABLE_CODES = ['REDIRECT_URI_NOT_ALLOWED', 'AUTH_PROVIDER_DISABLED']
// 로그인 시도가 만료됐거나 이미 쓴 코드 — 처음부터 다시 로그인하면 된다
const EXPIRED_CODES = ['AUTH_CODE_ALREADY_USED', 'OAUTH_VERIFICATION_FAILED', 'RESOURCE_NOT_FOUND']

// 로그인 시작(POST /auth/authorizations) · 코드 교환(POST /auth/token) 실패를 안내 문구로 바꾼다
export function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return LOGIN_ERROR
  if (UNAVAILABLE_CODES.includes(error.code)) return '지금은 카카오 로그인을 쓸 수 없어요. 잠시 후 다시 시도해 주세요.'
  if (EXPIRED_CODES.includes(error.code)) return '로그인 시간이 지났어요. 다시 로그인해 주세요.'
  if (error.status >= 500) return '로그인 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.'
  return LOGIN_ERROR
}
