import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as drivesApi from '@/api/drives'
import type { Drive } from '@/types/drive'
import useActiveDrive from './useActiveDrive'

const active = (status: Drive['status'] | null, routeId: string | null = null) => ({
  data: { drive: status ? ({ id: 'drv_1', status, routeId } as Drive) : null },
  meta: { requestId: 'r', serverTime: '' },
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useActiveDrive', () => {
  it.each([
    ['ACTIVE', 'driving'],
    ['PAUSED', 'driving'],
    ['PREPARING', 'preparing'],
    ['ENDED', 'none'],
    [null, 'none'],
  ] as const)('남아 있는 드라이브 상태가 %s면 %s', async (status, expected) => {
    vi.spyOn(drivesApi, 'getActiveDrive').mockResolvedValue(active(status))

    const { result } = renderHook(() => useActiveDrive())

    await waitFor(() => expect(result.current.state).toBe(expected))
  })

  // 홈 교통 상황 카드가 이 드라이브에 담긴 경로의 교통 상태를 보여준다
  it('남아 있는 드라이브에 경로가 담겨 있으면 경로 id를 함께 돌려준다', async () => {
    vi.spyOn(drivesApi, 'getActiveDrive').mockResolvedValue(active('PREPARING', 'rte_1'))

    const { result } = renderHook(() => useActiveDrive())

    await waitFor(() => expect(result.current).toEqual({ state: 'preparing', routeId: 'rte_1' }))
  })

  it('남은 드라이브가 없으면 경로도 없다', async () => {
    vi.spyOn(drivesApi, 'getActiveDrive').mockResolvedValue(active('ENDED', 'rte_1'))

    const { result } = renderHook(() => useActiveDrive())

    await waitFor(() => expect(drivesApi.getActiveDrive).toHaveBeenCalled())
    expect(result.current).toEqual({ state: 'none', routeId: null })
  })
})
