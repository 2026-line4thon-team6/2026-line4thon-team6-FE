import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MemoryGamePage from './MemoryGamePage'

const props = {
  question: null,
  names: { DRIVER: '희짱', PASSENGER: '덩민' },
  winner: null,
  busy: false,
  onWinnerChange: vi.fn(),
  onNext: vi.fn(),
  onRetry: vi.fn(),
  onAbandon: vi.fn(),
}

describe('추억 게임 화면', () => {
  it('함께 마친 드라이브가 없으면 안내만 보여 주고 다시 시도는 숨긴다', () => {
    render(<MemoryGamePage {...props} status="error" noRecords />)

    expect(screen.getByRole('alert')).toHaveTextContent('아직 함께 마친 드라이브가 없어요.')
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
  })

  it('다른 이유로 못 만들면 다시 시도를 보여 준다', () => {
    render(<MemoryGamePage {...props} status="error" />)

    expect(screen.getByRole('alert')).toHaveTextContent('문제를 만들지 못했어요.')
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
