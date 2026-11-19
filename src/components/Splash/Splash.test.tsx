import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Splash from './Splash'
import { HOLD, TIME_SCALE, TRANSITION } from './splashMotion'

const HOLD_MS = HOLD * TIME_SCALE * 1000
const TRANSITION_MS = TRANSITION * TIME_SCALE * 1000

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.querySelectorAll('[data-splash-logo]').forEach((el) => el.remove())
})

describe('스플래시', () => {
  it('붕붕어스 스플래시를 화면에 보여 준다', () => {
    render(<Splash ready={false} onDone={() => {}} />)
    expect(screen.getByRole('img', { name: '붕붕어스' })).toBeInTheDocument()
  })

  it('앱이 준비되지 않았으면 애니메이션이 끝나도 완성된 로고로 기다린다', () => {
    const onDone = vi.fn()
    render(<Splash ready={false} onDone={onDone} />)
    advance(10_000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('앱이 준비되어 있으면 정차 후 전환까지 마치고 끝낸다', () => {
    const onDone = vi.fn()
    render(<Splash ready onDone={onDone} />)
    advance(HOLD_MS - 100)
    expect(onDone).not.toHaveBeenCalled()
    advance(TRANSITION_MS + 300)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('기다리는 중에 앱이 준비되면 바로 전환한다', () => {
    const onDone = vi.fn()
    const { rerender } = render(<Splash ready={false} onDone={onDone} />)
    advance(HOLD_MS + 2_000)
    rerender(<Splash ready onDone={onDone} />)
    advance(TRANSITION_MS + 300)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('화면을 탭하면 남은 애니메이션을 건너뛰고 전환한다', () => {
    const onDone = vi.fn()
    render(<Splash ready onDone={onDone} />)
    advance(400)
    fireEvent.click(screen.getByRole('img', { name: '붕붕어스' }))
    advance(TRANSITION_MS + 300)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('동작 줄이기 설정이면 애니메이션 없이 잠깐 보여 주고 끝낸다', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    const onDone = vi.fn()
    render(<Splash ready onDone={onDone} />)
    advance(800)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('로그인 로고가 있으면 전환하는 동안 숨겼다가 끝나면 다시 보여 준다', () => {
    const logo = document.createElement('img')
    logo.setAttribute('data-splash-logo', '')
    document.body.appendChild(logo)
    const onDone = vi.fn()
    const { unmount } = render(<Splash ready onDone={onDone} />)
    advance(HOLD_MS + 100)
    expect(logo.style.visibility).toBe('hidden')
    advance(TRANSITION_MS + 300)
    expect(onDone).toHaveBeenCalled()
    unmount()
    expect(logo.style.visibility).toBe('')
  })
})
