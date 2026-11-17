import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoute } from '@/api/routes'
import type { PlaceSummary } from '@/types/place'
import type { Route } from '@/types/route'
import { getCurrentCoordinate } from '@/utils/location'
import usePlaceRoute from './usePlaceRoute'

vi.mock('@/api/routes', () => ({ createRoute: vi.fn() }))
vi.mock('@/utils/location', () => ({ getCurrentCoordinate: vi.fn() }))

const here = { latitude: 37.5665, longitude: 126.978 }
const oido = { latitude: 37.3456, longitude: 126.6889 }
const place = {
  id: 'plc_01',
  name: '시흥 오이도',
  address: '경기 시흥시 오이도로 175',
  coordinate: oido,
} as PlaceSummary

afterEach(() => vi.clearAllMocks())

describe('usePlaceRoute', () => {
  it('현재 위치에서 장소까지 경로를 만들어 경로와 예상 소요 시간을 돌려준다', async () => {
    vi.mocked(getCurrentCoordinate).mockResolvedValue(here)
    vi.mocked(createRoute).mockResolvedValue({
      data: {
        polyline: '',
        origin: { placeId: null, name: '내 위치', address: '', coordinate: here },
        destination: { placeId: 'plc_01', name: '시흥 오이도', address: '', coordinate: oido },
        durationSeconds: 3000,
      } as unknown as Route,
      meta: { requestId: 'req', serverTime: '' },
    })

    const { result } = renderHook(() => usePlaceRoute(place))

    await waitFor(() => expect(result.current?.durationSeconds).toBe(3000))
    expect(result.current).toMatchObject({ origin: here, destination: oido })
    expect(vi.mocked(createRoute).mock.calls[0][0]).toEqual({
      origin: { placeId: null, name: '내 위치', address: '', coordinate: here },
      destination: { placeId: 'plc_01', name: '시흥 오이도', address: '경기 시흥시 오이도로 175', coordinate: oido },
    })
  })

  it('위치를 모르면 경로를 만들지 않는다', async () => {
    vi.mocked(getCurrentCoordinate).mockResolvedValue(null)

    const { result } = renderHook(() => usePlaceRoute(place))

    await waitFor(() => expect(getCurrentCoordinate).toHaveBeenCalled())
    expect(createRoute).not.toHaveBeenCalled()
    expect(result.current).toBeNull()
  })
})
