import { ApiError } from '@/api/client'

export const WITHDRAW_ERROR = '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.'
export const WITHDRAW_CANCELLED = '본인 확인을 취소해서 탈퇴하지 않았어요.'
export const WITHDRAWN_NOTICE = '탈퇴가 완료됐어요. 그동안 붕붕어스와 함께해 주셔서 고마워요.'
export const ACTIVE_DRIVE_MESSAGE = '진행 중인 드라이브가 있어요. 드라이브를 마치거나 그만둔 뒤 다시 시도해 주세요.'

// 본인 재인증(POST /auth/reauth/authorizations · /auth/reauth) · 탈퇴(DELETE /me) 실패를 안내 문구로 바꾼다
export function withdrawErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return WITHDRAW_ERROR
  if (error.code === 'ACTIVE_DRIVE_EXISTS') return ACTIVE_DRIVE_MESSAGE
  if (error.code === 'REAUTH_REQUIRED' || error.code === 'REAUTH_SUBJECT_MISMATCH') {
    return '본인 확인에 실패했어요. 가입한 카카오 계정으로 다시 시도해 주세요.'
  }
  if (error.code === 'OAUTH_STATE_MISMATCH') return '본인 확인 시간이 지났어요. 다시 시도해 주세요.'
  // 백엔드가 아직 탈퇴를 열지 않았거나(503) 카카오 연결 해제가 실패한 경우 (탈퇴 미완료, 다시 시도 가능)
  if (error.status === 503) return '지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.'
  return WITHDRAW_ERROR
}
