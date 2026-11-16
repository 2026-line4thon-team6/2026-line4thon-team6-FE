import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as placesApi from '@/api/places'
import { resetMockPlaces } from '@/mocks/places'
import useRecommendations from './useRecommendations'

const names = (places: { name: string }[] | null) => places?.map((place) => place.name) ?? null

beforeEach(() => {
  resetMockPlaces()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function renderLoaded() {
  const hook = renderHook(() => useRecommendations(true))
  await waitFor(() => expect(hook.result.current.places).not.toBeNull())
  return hook
}

describe('useRecommendations', () => {
  it('처음에는 바다 카테고리의 추천 장소를 불러온다', async () => {
    const { result } = await renderLoaded()

    expect(result.current.category).toBe('SEA')
    expect(names(result.current.places)).toEqual(['시흥 오이도', '강릉 헌화로', '인천 을왕리 해수욕장'])
  })

  it('카테고리를 바꾸면 그 카테고리를 불러오고, 한 번 불러온 카테고리는 다시 요청하지 않는다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchRecommendations')
    const { result } = await renderLoaded()

    act(() => result.current.setCategory('NEARBY_CAFE'))
    expect(result.current.places).toBeNull()
    await waitFor(() => expect(names(result.current.places)).toEqual(['남양주 북한강 카페거리', '파주 헤이리 예술마을', '양평 서종 카페거리']))

    act(() => result.current.setCategory('SEA'))
    expect(names(result.current.places)).toEqual(['시흥 오이도', '강릉 헌화로', '인천 을왕리 해수욕장'])
    expect(spy.mock.calls.map(([category]) => category)).toEqual(['SEA', 'NEARBY_CAFE'])
  })

  it('하트를 누르면 바로 바꾸고 서버에 찜을 저장한다', async () => {
    const save = vi.spyOn(placesApi, 'setPlaceFavorite')
    const { result } = await renderLoaded()

    await act(() => result.current.toggleFavorite('plc_heonhwaro', true))

    expect(result.current.places?.find((place) => place.id === 'plc_heonhwaro')?.isFavorite).toBe(true)
    expect(save).toHaveBeenCalledWith('plc_heonhwaro', true)
  })

  it('찜 저장에 실패하면 원래대로 되돌린다', async () => {
    vi.spyOn(placesApi, 'setPlaceFavorite').mockRejectedValue(new Error('network'))
    const { result } = await renderLoaded()

    await act(() => result.current.toggleFavorite('plc_oido', false))

    expect(result.current.places?.find((place) => place.id === 'plc_oido')?.isFavorite).toBe(true)
  })

  it('다른 화면(상세 · 보관함)에서 바꾼 찜 상태를 서버 요청 없이 맞춘다', async () => {
    const save = vi.spyOn(placesApi, 'setPlaceFavorite')
    const { result } = await renderLoaded()

    act(() => result.current.syncFavorite('plc_eurwangni', true))

    expect(result.current.places?.find((place) => place.id === 'plc_eurwangni')?.isFavorite).toBe(true)
    expect(save).not.toHaveBeenCalled()
  })

  it('로그인 전에는 부르지 않는다', () => {
    const spy = vi.spyOn(placesApi, 'fetchRecommendations')
    renderHook(() => useRecommendations(false))

    expect(spy).not.toHaveBeenCalled()
  })
})
