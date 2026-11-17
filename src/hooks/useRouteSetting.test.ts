import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoute } from '@/api/routes'
import type { Route } from '@/types/route'
import type { SearchPlace } from '@/types/search'
import useRouteSetting from './useRouteSetting'

vi.mock('@/api/routes', () => ({ createRoute: vi.fn() }))
vi.mock('@/utils/location', () => ({
  getCurrentCoordinate: vi.fn().mockResolvedValue({ latitude: 37.4979, longitude: 127.0276 }),
}))

const place = (canSave: boolean): SearchPlace => ({
  id: canSave ? 'plc_01' : 'plc_k_abc',
  name: '반포 한강공원',
  region: '서울 서초구',
  address: '서울 서초구 신반포로11길 40',
  coordinate: { latitude: 37.5101, longitude: 126.9955 },
  thumbnailUrl: null,
  category: 'NATURE',
  hashtags: [],
  estimatedDurationSeconds: null,
  distanceMeters: null,
  isFavorite: false,
  canSave,
})

afterEach(() => vi.clearAllMocks())

async function routeTo(selected: SearchPlace) {
  vi.mocked(createRoute).mockResolvedValue({ data: {} as Route, meta: { requestId: 'req', serverTime: '' } })
  const { result } = renderHook(() => useRouteSetting())
  await waitFor(() => expect(result.current.origin).not.toBeNull())
  await act(async () => result.current.selectPlace(selected))
  return vi.mocked(createRoute).mock.calls[0][0].destination
}

describe('useRouteSetting', () => {
  it('카카오 검색 결과로 경로를 찾으면 placeId 없이 좌표만 보낸다', async () => {
    const destination = await routeTo(place(false))

    expect(destination).toEqual({
      placeId: null,
      name: '반포 한강공원',
      address: '서울 서초구 신반포로11길 40',
      coordinate: { latitude: 37.5101, longitude: 126.9955 },
    })
  })

  it('우리 장소는 placeId를 함께 보낸다', async () => {
    const destination = await routeTo(place(true))

    expect(destination.placeId).toBe('plc_01')
  })
})
