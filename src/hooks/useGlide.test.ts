import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useGlide from './useGlide'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('useGlide', () => {
  it('처음 값은 바로 보여 준다', () => {
    const { result } = renderHook(({ target }) => useGlide(target), { initialProps: { target: 100 as number | null } })
    advance(16)

    expect(result.current).toBe(100)
  })

  it('새 목표는 지난 갱신 간격 동안 이어서 움직여 도착한다', () => {
    const { result, rerender } = renderHook(({ target }) => useGlide(target), { initialProps: { target: 0 as number | null } })
    advance(16)
    advance(984) // 다음 위치가 1초 뒤에 온다
    rerender({ target: 100 })

    advance(500)
    expect(result.current).toBeGreaterThan(30)
    expect(result.current).toBeLessThan(70)

    // 지난 간격보다 조금 더 길게(1.15배) 움직여 다음 위치가 늦어도 멈춰 서지 않는다
    advance(700)
    expect(result.current).toBe(100)
  })

  it('너무 멀리 튀거나 뒤로 가면 이어 움직이지 않고 바로 옮긴다', () => {
    const { result, rerender } = renderHook(({ target }) => useGlide(target), { initialProps: { target: 1000 as number | null } })
    advance(500)
    rerender({ target: 900 })
    advance(16)

    expect(result.current).toBe(900)
  })

  it('목표가 없어지면 값도 없앤다', () => {
    const { result, rerender } = renderHook(({ target }) => useGlide(target), { initialProps: { target: 10 as number | null } })
    advance(16)
    rerender({ target: null })
    advance(16)

    expect(result.current).toBeNull()
  })
})
