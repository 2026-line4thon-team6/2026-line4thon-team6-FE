import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import * as couplesApi from '@/api/couples'
import { MOCK_PARTNER_INVITE_CODE, mockDisconnectCouple, resetMockCouple } from '@/mocks/couples'
import useCoupleInvite from './useCoupleInvite'

const apiError = (status: number, code: string) =>
  new ApiError(status, {
    error: { code, message: code, details: [], retryable: false },
    meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
  })

beforeEach(async () => {
  resetMockCouple()
  await mockDisconnectCouple() // 연인 초대 화면은 미연결 사용자가 들어온다
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('내 코드', () => {
  it('내 코드가 없으면 새로 발급해서 보여 준다', async () => {
    const create = vi.spyOn(couplesApi, 'createCoupleInvite')
    const { result } = renderHook(() => useCoupleInvite())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(create).toHaveBeenCalledTimes(1)
    expect(result.current.code).toMatch(/\S+/)
  })

  it('유효한 코드가 있으면 발급하지 않고 그 코드를 쓴다', async () => {
    vi.spyOn(couplesApi, 'fetchMyInvite').mockResolvedValue({
      data: { inviteId: 'inv_9', code: 'ab12cd34', expiresAt: '2026-11-14T00:00:00Z', status: 'ACTIVE' },
      meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
    })
    const create = vi.spyOn(couplesApi, 'createCoupleInvite')
    const { result } = renderHook(() => useCoupleInvite())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.code).toBe('ab12cd34')
    expect(create).not.toHaveBeenCalled()
  })

  it('이미 연인과 연결돼 있으면 linked', async () => {
    resetMockCouple()
    const { result } = renderHook(() => useCoupleInvite())

    await waitFor(() => expect(result.current.status).toBe('linked'))
  })

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    vi.spyOn(couplesApi, 'createCoupleInvite').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useCoupleInvite())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
})

describe('연인 코드로 연결', () => {
  it('올바른 코드면 연결하고 null을 돌려준다', async () => {
    const { result } = renderHook(() => useCoupleInvite())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: string | null = 'pending'
    await act(async () => {
      error = await result.current.connect(MOCK_PARTNER_INVITE_CODE)
    })

    expect(error).toBeNull()
  })

  it.each([
    [422, 'INVALID_INVITE', '코드를 다시 확인해 주세요.'],
    [422, 'SELF_INVITE', '내 코드는 입력할 수 없어요. 연인의 코드를 입력해 주세요.'],
    [409, 'INVITE_CONSUMED', '이미 사용된 코드예요. 연인에게 새 코드를 받아 주세요.'],
    [409, 'ALREADY_COUPLED', '이미 연인과 연결되어 있어요.'],
    [409, 'COUPLE_RESTORE_REQUIRED', '예전에 연결했던 연인이에요. 연결 복구가 필요해요.'],
    [500, 'INTERNAL', '연결하지 못했어요. 잠시 후 다시 시도해 주세요.'],
  ])('%i %s 오류는 안내 문구로 돌려준다', async (status, code, message) => {
    vi.spyOn(couplesApi, 'joinCouple').mockRejectedValue(apiError(status, code))
    const { result } = renderHook(() => useCoupleInvite())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: string | null = null
    await act(async () => {
      error = await result.current.connect('ab12cd34')
    })

    expect(error).toBe(message)
  })

  it('같은 코드로 다시 시도하면 같은 멱등 키를, 코드를 바꾸면 새 키를 쓴다', async () => {
    const join = vi.spyOn(couplesApi, 'joinCouple').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useCoupleInvite())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.connect('ab12cd34')
      await result.current.connect(' ab12cd34 ')
      await result.current.connect('zz99')
    })

    const keys = join.mock.calls.map(([, key]) => key)
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
  })
})
