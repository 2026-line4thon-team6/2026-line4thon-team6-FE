import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as placesApi from '@/api/places'
import { ApiError } from '@/api/client'
import type { PublicPlace } from '@/types/place'
import usePublicPlace from './usePublicPlace'

const PLACE: PublicPlace = {
  id: 'plc_test',
  name: '시흥 오이도',
  address: '경기 시흥시 정왕동',
  coordinate: { latitude: 37.3456, longitude: 126.6878 },
  thumbnailUrl: null,
  introduction: null,
}

const META = { requestId: 'req', serverTime: '2026-11-16T00:00:00Z' }

afterEach(() => vi.restoreAllMocks())

describe('usePublicPlace', () => {
  it('공개 장소를 불러온다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchPublicPlace').mockResolvedValue({ data: PLACE, meta: META })
    const { result } = renderHook(() => usePublicPlace('plc_test'))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledWith('plc_test')
    expect(result.current.place).toEqual(PLACE)
  })

  it('없는 장소(404)면 notFound가 된다', async () => {
    vi.spyOn(placesApi, 'fetchPublicPlace').mockRejectedValue(new ApiError(404, null))
    const { result } = renderHook(() => usePublicPlace('plc_none'))

    await waitFor(() => expect(result.current.status).toBe('notFound'))
  })

  it('그 밖의 실패는 error가 되고, 다시 시도하면 새로 불러온다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchPublicPlace').mockRejectedValueOnce(new ApiError(500, null))
    const { result } = renderHook(() => usePublicPlace('plc_test'))
    await waitFor(() => expect(result.current.status).toBe('error'))

    spy.mockResolvedValueOnce({ data: PLACE, meta: META })
    act(() => result.current.retry())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.place?.name).toBe('시흥 오이도')
  })
})
