import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as cardsApi from '@/api/cards'
import { ApiError } from '@/api/client'
import type { Card } from '@/types/card'
import usePendingCardDiscard from './usePendingCardDiscard'

const CARD = { id: 'crd_1', driveId: 'drv_1', coupleId: 'cpl_1', version: 1, status: 'UNWRITTEN' } as Card
const meta = { requestId: 'r', serverTime: '' }

afterEach(() => {
  vi.restoreAllMocks()
})

// 미작성 카드 목록에서 바로 지운다. 목록(GET /home)에는 카드 버전 · 커플 id가 없어 카드를 먼저 불러온 뒤 폐기한다
describe('usePendingCardDiscard', () => {
  it('카드를 불러와 그 버전으로 폐기하고, 목록을 다시 불러온다', async () => {
    vi.spyOn(cardsApi, 'fetchDriveCard').mockResolvedValue({ data: CARD, meta })
    const discard = vi.spyOn(cardsApi, 'discardCard').mockResolvedValue()
    const onChanged = vi.fn()
    const { result } = renderHook(() => usePendingCardDiscard(onChanged))

    let outcome
    await act(async () => {
      outcome = await result.current('drv_1')
    })

    expect(outcome).toBe('deleted')
    expect(discard).toHaveBeenCalledWith(CARD, expect.any(String))
    expect(onChanged).toHaveBeenCalled()
  })

  it('그사이 연인이 쓰기 시작했으면 started, 목록은 다시 불러와 작성 중으로 보이게 한다', async () => {
    vi.spyOn(cardsApi, 'fetchDriveCard').mockResolvedValue({ data: CARD, meta })
    vi.spyOn(cardsApi, 'discardCard').mockRejectedValue(new ApiError(409, { error: { code: 'CARD_DRAFT_STARTED', message: '' } } as never))
    const onChanged = vi.fn()
    const { result } = renderHook(() => usePendingCardDiscard(onChanged))

    let outcome
    await act(async () => {
      outcome = await result.current('drv_1')
    })

    expect(outcome).toBe('started')
    expect(onChanged).toHaveBeenCalled()
  })

  it('이미 사라진 카드(404 · 410)는 지워진 것으로, 그 밖의 실패는 failed로 본다', async () => {
    vi.spyOn(cardsApi, 'fetchDriveCard')
      .mockRejectedValueOnce(new ApiError(404, { error: { code: 'CARD_UNAVAILABLE', message: '' } } as never))
      .mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => usePendingCardDiscard(vi.fn()))

    let gone, failed
    await act(async () => {
      gone = await result.current('drv_1')
      failed = await result.current('drv_1')
    })

    expect([gone, failed]).toEqual(['deleted', 'failed'])
  })
})
