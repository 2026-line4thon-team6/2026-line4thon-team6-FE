import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingCard } from '@/types/card'
import usePendingCards from './usePendingCards'

const card = (driveId: string, remainingSeconds: number, extra: Partial<PendingCard> = {}): PendingCard => ({
  cardId: `crd_${driveId}`,
  driveId,
  title: '드라이브',
  status: 'UNWRITTEN',
  editableUntil: '2026-11-14T00:00:00Z',
  remainingSeconds,
  hasDraftContent: false,
  ...extra,
})

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePendingCards', () => {
  it('미작성 카드 수와 마감이 가장 빠른 카드를 알려 준다', () => {
    const { result } = renderHook(() => usePendingCards([card('drv_a', 3600), card('drv_b', 7200)], Date.now()))

    expect(result.current).toMatchObject({ count: 2, driveId: 'drv_a', remainingSeconds: 3600 })
  })

  it('카드를 하나씩 고를 수 있도록 마감순 목록을 함께 준다. 쓰기 시작한 카드는 작성 중으로 표시한다', () => {
    const cards = [
      card('drv_late', 7200, { title: '늦은 드라이브', status: 'DRAFT', editableUntil: '2026-11-18T06:00:00Z' }),
      card('drv_soon', 600, { title: '급한 드라이브', hasDraftContent: false, editableUntil: '2026-11-17T09:00:00Z' }),
    ]
    const { result } = renderHook(() => usePendingCards(cards, Date.now()))

    expect(result.current?.cards).toEqual([
      { cardId: 'crd_drv_soon', driveId: 'drv_soon', title: '급한 드라이브', remainingSeconds: 600, writing: false, endedAt: '2026-11-16T09:00:00.000Z' },
      { cardId: 'crd_drv_late', driveId: 'drv_late', title: '늦은 드라이브', remainingSeconds: 7200, writing: true, endedAt: '2026-11-17T06:00:00.000Z' },
    ])
  })

  it('없거나 아직 불러오지 않았으면 null', () => {
    expect(renderHook(() => usePendingCards([], Date.now())).result.current).toBeNull()
    expect(renderHook(() => usePendingCards(null, 0)).result.current).toBeNull()
  })

  it('남은 시간이 1초마다 줄고, 마감이 지난 카드는 빠진다', () => {
    const cards = [card('drv_a', 2), card('drv_b', 10)]
    const receivedAt = Date.now()
    const { result } = renderHook(() => usePendingCards(cards, receivedAt))

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toMatchObject({ count: 2, driveId: 'drv_a', remainingSeconds: 1 })

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current).toMatchObject({ count: 1, driveId: 'drv_b', remainingSeconds: 7 })
  })

  it('홈을 다시 불러와 목록이 바뀌면 새 남은 시간으로 다시 센다', () => {
    const { result, rerender } = renderHook(({ cards, at }) => usePendingCards(cards, at), {
      initialProps: { cards: [card('drv_a', 100)], at: Date.now() },
    })

    act(() => vi.advanceTimersByTime(10_000))
    rerender({ cards: [card('drv_a', 50)], at: Date.now() })

    expect(result.current).toMatchObject({ count: 1, driveId: 'drv_a', remainingSeconds: 50 })
  })
})
