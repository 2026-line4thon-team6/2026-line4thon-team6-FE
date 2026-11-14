import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useArrival from './useArrival'

const destination = { latitude: 37.5103, longitude: 126.9955 }
// 위도 0.0005도 ≈ 55m, 0.002도 ≈ 220m
const near = { latitude: 37.5108, longitude: 126.9955 }
const far = { latitude: 37.5123, longitude: 126.9955 }

function setup(options: { active?: boolean; current?: typeof near; accuracyMeters?: number }) {
  const onArrive = vi.fn(() => Promise.resolve(true))
  renderHook(() =>
    useArrival({
      active: options.active ?? true,
      current: options.current ?? near,
      accuracyMeters: options.accuracyMeters ?? 10,
      destination,
      onArrive,
    }),
  )
  return onArrive
}

describe('useArrival', () => {
  it('목적지 100m 안에 정확한 위치로 들어오면 도착을 한 번 보낸다', () => {
    expect(setup({})).toHaveBeenCalledTimes(1)
  })

  it('100m 밖이면 보내지 않는다', () => {
    expect(setup({ current: far })).not.toHaveBeenCalled()
  })

  it('위치 정확도가 50m보다 나쁘면 보내지 않는다', () => {
    expect(setup({ accuracyMeters: 80 })).not.toHaveBeenCalled()
  })

  it('주행 중이 아니면(일시정지 등) 보내지 않는다', () => {
    expect(setup({ active: false })).not.toHaveBeenCalled()
  })
})
