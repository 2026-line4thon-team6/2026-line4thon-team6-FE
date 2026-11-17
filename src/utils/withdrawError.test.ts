import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { WITHDRAW_ERROR, withdrawErrorMessage } from './withdrawError'

const apiError = (status: number, code: string) => new ApiError(status, { error: { code, message: '', details: [], retryable: false } })

// 회원 탈퇴(재인증 · DELETE /me) 실패를 사용자가 할 일이 보이는 문구로 바꾼다
describe('withdrawErrorMessage', () => {
  it.each([
    [apiError(409, 'ACTIVE_DRIVE_EXISTS'), '진행 중인 드라이브가 있어요. 드라이브를 마치거나 그만둔 뒤 다시 시도해 주세요.'],
    [apiError(401, 'REAUTH_REQUIRED'), '본인 확인에 실패했어요. 가입한 카카오 계정으로 다시 시도해 주세요.'],
    [apiError(403, 'REAUTH_SUBJECT_MISMATCH'), '본인 확인에 실패했어요. 가입한 카카오 계정으로 다시 시도해 주세요.'],
    [apiError(400, 'OAUTH_STATE_MISMATCH'), '본인 확인 시간이 지났어요. 다시 시도해 주세요.'],
    [apiError(503, 'SERVICE_UNAVAILABLE'), '지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.'],
    [apiError(503, 'PROVIDER_UNLINK_FAILED'), '지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.'],
    [new Error('network'), WITHDRAW_ERROR],
  ])('%s', (error, message) => {
    expect(withdrawErrorMessage(error)).toBe(message)
  })
})
