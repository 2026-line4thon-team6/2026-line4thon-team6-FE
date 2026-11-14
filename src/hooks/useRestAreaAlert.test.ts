import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RestArea } from '@/types/restArea'
import useRestAreaAlert from './useRestAreaAlert'

const area = (id: string, latitude: number, distanceAlongRouteMeters: number | null = 1500): RestArea => ({
  id,
  name: `${id}휴게소`,
  highwayName: '서해안고속도로',
  direction: null,
  coordinate: { latitude, longitude: 126.8 },
  distanceAlongRouteMeters,
  earned: false,
  earnedAt: null,
  address: null,
  distanceMeters: null,
})

// 위도 0.01도 ≈ 1.1km
const current = { latitude: 37.0, longitude: 126.8 }

describe('useRestAreaAlert', () => {
  it('2km 안의 가장 가까운 휴게소를 알린다', () => {
    const { result } = renderHook(() => useRestAreaAlert([area('먼', 37.05), area('가까운', 37.01), area('중간', 37.015)], current, true))

    expect(result.current.alert?.restArea.id).toBe('가까운')
    expect(result.current.alert?.meters).toBeLessThan(2000)
  })

  it('이미 지나친 휴게소(경로상 남은 거리 0 이하)와 2km 밖은 알리지 않는다', () => {
    const { result } = renderHook(() => useRestAreaAlert([area('지난', 37.005, 0), area('먼', 37.05)], current, true))

    expect(result.current.alert).toBeNull()
  })

  it('닫으면 그 휴게소는 다시 알리지 않고 다음으로 가까운 곳을 알린다', () => {
    const { result } = renderHook(() => useRestAreaAlert([area('가까운', 37.01), area('중간', 37.015)], current, true))

    act(() => result.current.dismiss('가까운'))
    expect(result.current.alert?.restArea.id).toBe('중간')
  })

  it('주행 중이 아니면 알리지 않는다', () => {
    const { result } = renderHook(() => useRestAreaAlert([area('가까운', 37.01)], current, false))

    expect(result.current.alert).toBeNull()
  })
})
