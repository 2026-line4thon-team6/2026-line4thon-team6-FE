import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ActiveDriveBanner from './ActiveDriveBanner'

describe('ActiveDriveBanner', () => {
  it('출발한 드라이브는 기록 중이라고 알린다', () => {
    render(<ActiveDriveBanner onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('현재 기록 중인 드라이브가 있어요!')
  })

  it('준비만 하고 나간 드라이브는 이어서 준비하거나 정리하라고 알린다', () => {
    render(<ActiveDriveBanner preparing onClick={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent('준비 중인 드라이브가 있어요!')
    expect(screen.getByRole('button')).toHaveTextContent('눌러서 이어서 준비하기')
  })
})
