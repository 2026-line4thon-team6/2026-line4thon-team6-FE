import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PendingCardItem } from '@/hooks/usePendingCards'
import PendingCardSheet from './PendingCardSheet'

const item = (driveId: string, extra: Partial<PendingCardItem> = {}): PendingCardItem => ({
  cardId: `crd_${driveId}`,
  driveId,
  title: '드라이브',
  remainingSeconds: 3 * 3600,
  writing: false,
  endedAt: '2026-11-17T06:00:00.000Z',
  ...extra,
})

describe('PendingCardSheet', () => {
  it('작성하지 않은 카드를 받은 순서(마감순)대로 이름 · 마친 날 · 남은 시간과 함께 보여 준다', () => {
    render(
      <PendingCardSheet
        cards={[
          item('drv_a', { title: '강릉 바다 드라이브', remainingSeconds: 1800, endedAt: '2026-11-16T09:30:00.000Z' }),
          item('drv_b', { title: '남산 야경', remainingSeconds: 20 * 3600 }),
        ]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const sheet = screen.getByRole('dialog', { name: '작성하지 않은 드라이브 카드' })
    expect(within(sheet).getByRole('heading', { name: '작성하지 않은 카드 2개' })).toBeInTheDocument()
    const rows = within(sheet).getAllByRole('button', { name: /드라이브|야경/ })
    expect(rows[0]).toHaveTextContent('강릉 바다 드라이브')
    // 마친 날은 한국 시간 기준 (UTC 09:30 → 18:30)
    expect(rows[0]).toHaveTextContent('11월 16일')
    expect(rows[0]).toHaveTextContent('00:30:00 남음')
    expect(rows[1]).toHaveTextContent('남산 야경')
  })

  it('연인이나 내가 쓰기 시작한 카드는 작성 중으로 표시한다', () => {
    render(<PendingCardSheet cards={[item('drv_a', { title: '쓰던 카드', writing: true })]} onSelect={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /쓰던 카드/ })).toHaveTextContent('작성 중')
  })

  it('카드를 누르면 그 드라이브를 고르고, 닫기를 누르면 닫는다', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<PendingCardSheet cards={[item('drv_a', { title: '첫 카드' }), item('drv_b', { title: '둘째 카드' })]} onSelect={onSelect} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /둘째 카드/ }))
    expect(onSelect).toHaveBeenCalledWith('drv_b')

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalled()
  })
})
