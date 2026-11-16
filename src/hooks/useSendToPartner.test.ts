import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import useSendToPartner from './useSendToPartner'

const coupleError = (code: string) =>
  new ApiError(403, { error: { code, message: '', details: [], retryable: false }, meta: { requestId: 'r', serverTime: '' } })

describe('useSendToPartner', () => {
  it('실패한 전송을 다시 보내면 같은 멱등 키를 쓰고, 성공하면 다음 전송은 새 키를 쓴다', async () => {
    const send = vi.fn().mockRejectedValueOnce(new ApiError(503, null)).mockResolvedValue(undefined)
    const { result } = renderHook(() => useSendToPartner({ coupleId: 'cpl_1', send, onCoupleChanged: vi.fn() }))

    await act(() => expect(result.current()).rejects.toBeInstanceOf(ApiError))
    await act(() => result.current())
    await act(() => result.current())

    const keys = send.mock.calls.map(([options]) => options.idempotencyKey)
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[1])
  })

  it.each(['COUPLE_CONTEXT_CHANGED', 'COUPLE_REQUIRED'])(
    '커플이 바뀌었다는 403(%s)이면 커플 정보를 다시 불러오고 다음 전송은 새 키를 쓴다',
    async (code) => {
      const send = vi.fn().mockRejectedValueOnce(coupleError(code)).mockResolvedValue(undefined)
      const onCoupleChanged = vi.fn()
      const { result } = renderHook(() => useSendToPartner({ coupleId: 'cpl_1', send, onCoupleChanged }))

      await act(() => expect(result.current()).rejects.toBeInstanceOf(ApiError))
      await act(() => result.current())

      expect(onCoupleChanged).toHaveBeenCalledTimes(1)
      const keys = send.mock.calls.map(([options]) => options.idempotencyKey)
      expect(keys[1]).not.toBe(keys[0])
    },
  )
})
