import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PendingCardBanner from './PendingCardBanner'

// Figma '카드 미작성 배너' 기준
describe('PendingCardBanner', () => {
  it('미작성 카드 수와 가장 빠른 마감까지 남은 시간을 표시한다', () => {
    render(<PendingCardBanner count={1} remainingSeconds={18 * 3600} onClick={vi.fn()} />)

    const banner = screen.getByRole('button', { name: /미작성 드라이브 카드 1개/ })
    expect(banner).toHaveTextContent('남은 시간 18:00:00')
    expect(banner).toHaveTextContent('눌러서 완성하기')
  })

  it('누르면 카드 작성으로 이동한다', async () => {
    const onClick = vi.fn()
    render(<PendingCardBanner count={2} remainingSeconds={3600} onClick={onClick} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /미작성 드라이브 카드 2개/ }))

    expect(onClick).toHaveBeenCalled()
  })
})
