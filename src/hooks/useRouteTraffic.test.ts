import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as routesApi from '@/api/routes'
import type { Route, TrafficSummary } from '@/types/route'
import useRouteTraffic from './useRouteTraffic'

const routeWith = (trafficSummary: TrafficSummary | null) => ({
  data: { id: 'rte_1', trafficSummary } as Route,
  meta: { requestId: 'r', serverTime: '' },
})

afterEach(() => {
  vi.restoreAllMocks()
})

// 홈 교통 상황 카드: 선택한 경로 응답의 trafficSummary.status (백엔드 GET /home 설명)
describe('useRouteTraffic', () => {
  it.each([
    ['SMOOTH', '원활'],
    ['SLOW', '서행'],
    ['CONGESTED', '정체'],
    ['BLOCKED', '통행 불가'],
  ] as const)('경로의 교통 상태가 %s면 %s', async (status, label) => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(routeWith({ status, congestedDistanceMeters: 0 }))

    const { result } = renderHook(() => useRouteTraffic('rte_1'))

    await waitFor(() => expect(result.current).toBe(label))
    expect(routesApi.getRoute).toHaveBeenCalledWith('rte_1')
  })

  it('선택한 경로가 없으면 경로를 부르지 않고 null', () => {
    const getRoute = vi.spyOn(routesApi, 'getRoute')

    const { result } = renderHook(() => useRouteTraffic(null))

    expect(result.current).toBeNull()
    expect(getRoute).not.toHaveBeenCalled()
  })

  it('교통 요약이 null이면 null', async () => {
    const getRoute = vi.spyOn(routesApi, 'getRoute').mockResolvedValue(routeWith(null))

    const { result } = renderHook(() => useRouteTraffic('rte_1'))

    await waitFor(() => expect(getRoute).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  it('경로를 불러오지 못하면(만료 등) null', async () => {
    const getRoute = vi.spyOn(routesApi, 'getRoute').mockRejectedValue(new Error('ROUTE_EXPIRED'))

    const { result } = renderHook(() => useRouteTraffic('rte_1'))

    await waitFor(() => expect(getRoute).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  it('경로가 없어지면 이전 교통 상태를 지운다', async () => {
    vi.spyOn(routesApi, 'getRoute').mockResolvedValue(routeWith({ status: 'SMOOTH', congestedDistanceMeters: 0 }))
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useRouteTraffic(id), {
      initialProps: { id: 'rte_1' as string | null },
    })
    await waitFor(() => expect(result.current).toBe('원활'))

    rerender({ id: null })

    expect(result.current).toBeNull()
  })
})
