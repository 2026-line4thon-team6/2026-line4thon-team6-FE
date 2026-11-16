import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { loginErrorMessage } from './loginError'

const apiError = (status: number, code: string) =>
  new ApiError(status, { error: { code, message: '', details: [], retryable: status >= 500 }, meta: { requestId: 'r', serverTime: '' } })

describe('loginErrorMessage', () => {
  it.each([
    [apiError(422, 'REDIRECT_URI_NOT_ALLOWED'), '지금은 카카오 로그인을 쓸 수 없어요. 잠시 후 다시 시도해 주세요.'],
    [apiError(422, 'AUTH_PROVIDER_DISABLED'), '지금은 카카오 로그인을 쓸 수 없어요. 잠시 후 다시 시도해 주세요.'],
    [apiError(409, 'AUTH_CODE_ALREADY_USED'), '로그인 시간이 지났어요. 다시 로그인해 주세요.'],
    [apiError(401, 'OAUTH_VERIFICATION_FAILED'), '로그인 시간이 지났어요. 다시 로그인해 주세요.'],
    [apiError(404, 'RESOURCE_NOT_FOUND'), '로그인 시간이 지났어요. 다시 로그인해 주세요.'],
    [apiError(503, 'SERVICE_UNAVAILABLE'), '로그인 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.'],
    [new Error('network'), '로그인하지 못했어요. 다시 시도해 주세요.'],
  ])('%s → 알맞은 안내 문구', (error, message) => {
    expect(loginErrorMessage(error)).toBe(message)
  })
})
