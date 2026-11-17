import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RestArea, StampBook } from '@/types/restArea'
import StampBoard from './StampBoard'

const area = (index: number, earned: boolean) =>
  ({
    id: `rest_${index}`,
    name: `휴게소${index}`,
    earned,
    earnedAt: earned ? new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString() : null,
  }) as RestArea

const book = (earnedCount: number, capacity: number): StampBook =>
  ({
    earnedCount,
    catalogCount: capacity,
    capacity,
    items: Array.from({ length: capacity }, (_, i) => area(i, i < earnedCount)),
    nextCursor: null,
    hasMore: false,
  }) as StampBook

const renderBoard = (stampBook: StampBook) =>
  render(<StampBoard book={stampBook} onStampClick={vi.fn()} onEmptyClick={vi.fn()} />)

describe('도장판', () => {
  it('휴게소가 많아도 찍은 도장이 16개 이하면 도장판 한 장만 보여 주고, 개수는 전체 기준으로 표시한다', () => {
    const { container } = renderBoard(book(3, 215))

    expect(container.querySelectorAll('ul')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /도장$/ })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: '도장 찍기' })).toHaveLength(13)
    expect(screen.getByText('3 / 215')).toBeInTheDocument()
  })

  it('찍은 도장이 한 장을 넘으면 필요한 만큼 도장판을 늘린다', () => {
    const { container } = renderBoard(book(17, 215))

    expect(container.querySelectorAll('ul')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: '도장 찍기' })).toHaveLength(15)
  })
})
