import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PendingCards } from './usePendingCards'
import usePendingCardPicker from './usePendingCardPicker'

const summary = (count: number): PendingCards => ({
  count,
  driveId: 'drv_soon',
  remainingSeconds: 600,
  cards: Array.from({ length: count }, (_, index) => ({
    cardId: `crd_${index}`,
    driveId: index === 0 ? 'drv_soon' : `drv_${index}`,
    title: '드라이브',
    remainingSeconds: 600 + index,
    writing: false,
    endedAt: '2026-11-17T00:00:00.000Z',
  })),
})

describe('usePendingCardPicker', () => {
  it('미작성 카드가 1개면 배너를 누르자마자 그 카드로 간다', () => {
    const goCard = vi.fn()
    const { result } = renderHook(() => usePendingCardPicker(summary(1), goCard))

    act(() => result.current.open())

    expect(goCard).toHaveBeenCalledWith('drv_soon')
    expect(result.current.sheetOpen).toBe(false)
  })

  it('2개 이상이면 목록 시트를 열고, 고른 카드로 가면서 시트를 닫는다', () => {
    const goCard = vi.fn()
    const { result } = renderHook(() => usePendingCardPicker(summary(3), goCard))

    act(() => result.current.open())
    expect(goCard).not.toHaveBeenCalled()
    expect(result.current.sheetOpen).toBe(true)

    act(() => result.current.select('drv_2'))
    expect(goCard).toHaveBeenCalledWith('drv_2')
    expect(result.current.sheetOpen).toBe(false)
  })

  it('보는 사이 카드가 1개 이하로 줄면 시트를 닫는다', () => {
    const { result, rerender } = renderHook(({ value }) => usePendingCardPicker(value, vi.fn()), {
      initialProps: { value: summary(2) as PendingCards | null },
    })

    act(() => result.current.open())
    rerender({ value: null })

    expect(result.current.sheetOpen).toBe(false)
  })

  it('목록에서 지워 1개만 남아도 시트는 열어 둔다 (0개가 되면 닫는다)', () => {
    const { result, rerender } = renderHook(({ value }) => usePendingCardPicker(value, vi.fn()), {
      initialProps: { value: summary(2) as PendingCards | null },
    })

    act(() => result.current.open())
    rerender({ value: summary(1) })
    expect(result.current.sheetOpen).toBe(true)

    rerender({ value: null })
    expect(result.current.sheetOpen).toBe(false)
  })
})
