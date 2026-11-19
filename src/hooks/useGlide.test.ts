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

  it('오래 멈췄다 다시 움직이면 몇 번 안에 원래 간격(0.3초)에 맞춰 따라간다', () => {
    const { result, rerender } = renderHook(({ target }) => useGlide(target), { initialProps: { target: 0 as number | null } })
    advance(16)
    advance(180_000) // 휴게소에서 3분 멈춤
    for (let tick = 1; tick <= 6; tick += 1) {
      rerender({ target: tick * 10 })
      advance(300)
    }
    rerender({ target: 100 })

    // 멈춘 3분을 그대로 평균에 넣으면 계속 1.5초씩 걸려 뒤처진다
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
