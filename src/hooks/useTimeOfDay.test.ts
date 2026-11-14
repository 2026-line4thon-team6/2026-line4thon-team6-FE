import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import useTimeOfDay from './useTimeOfDay'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-14T16:59:30+09:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

it('화면이 켜져 있는 동안 시간대가 바뀌면 새 시간대로 바꾼다', () => {
  const { result } = renderHook(() => useTimeOfDay())
  expect(result.current).toBe('day')

  act(() => {
    vi.advanceTimersByTime(60_000)
  })

  expect(result.current).toBe('evening')
})
