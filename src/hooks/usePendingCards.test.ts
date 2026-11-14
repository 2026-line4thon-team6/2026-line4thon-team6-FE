import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as cardsApi from '@/api/cards'
import type { PendingCard } from '@/types/card'
import usePendingCards from './usePendingCards'

const card = (driveId: string, remainingSeconds: number): PendingCard => ({
  cardId: `crd_${driveId}`,
  driveId,
  title: '드라이브',
  status: 'UNWRITTEN',
  editableUntil: '2026-11-14T00:00:00Z',
  remainingSeconds,
  hasDraftContent: false,
})

function mockPending(cards: PendingCard[]) {
  vi.spyOn(cardsApi, 'fetchPendingCards').mockResolvedValue({
    data: cards,
    meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
  })
}

async function renderLoaded() {
  const hook = renderHook(() => usePendingCards())
  await act(async () => {}) // 목 응답 반영
  return hook
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('usePendingCards', () => {
  it('미작성 카드 수와 마감이 가장 빠른 카드를 알려 준다', async () => {
    mockPending([card('drv_a', 3600), card('drv_b', 7200)])

    const { result } = await renderLoaded()

    expect(result.current.summary).toEqual({ count: 2, driveId: 'drv_a', remainingSeconds: 3600 })
  })

  it('없으면 summary는 null', async () => {
    mockPending([])

    const { result } = await renderLoaded()

    expect(result.current.summary).toBeNull()
  })

  it('남은 시간이 1초마다 줄고, 마감이 지난 카드는 빠진다', async () => {
    mockPending([card('drv_a', 2), card('drv_b', 10)])
    const { result } = await renderLoaded()

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.summary).toEqual({ count: 2, driveId: 'drv_a', remainingSeconds: 1 })

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.summary).toEqual({ count: 1, driveId: 'drv_b', remainingSeconds: 7 })
  })

  it('불러오지 못하면 배너를 띄우지 않는다', async () => {
    vi.spyOn(cardsApi, 'fetchPendingCards').mockRejectedValue(new Error('network'))

    const { result } = await renderLoaded()

    expect(result.current.summary).toBeNull()
  })
})
