import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Toast from './Toast'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('안내 문구를 스크린 리더에도 알리고, 2초 뒤 사라지라고 알린다', () => {
    const onDone = vi.fn()
    render(<Toast message="커플 코드가 복사되었습니다." onDone={onDone} />)

    expect(screen.getByRole('status')).toHaveTextContent('커플 코드가 복사되었습니다.')
    act(() => vi.advanceTimersByTime(1999))
    expect(onDone).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onDone).toHaveBeenCalled()
  })
})
