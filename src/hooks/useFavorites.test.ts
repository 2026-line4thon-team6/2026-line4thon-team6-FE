import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as placesApi from '@/api/places'
import { resetMockPlaces } from '@/mocks/places'
import useFavorites from './useFavorites'

beforeEach(() => {
  resetMockPlaces()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFavorites', () => {
  it('처음에는 첫 칩(바다) 카테고리의 찜 목록을 불러온다 (홈 카테고리 칩과 같음)', async () => {
    const spy = vi.spyOn(placesApi, 'fetchFavorites')
    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledWith('SEA')
    expect(result.current.category).toBe('SEA')
    expect(result.current.places.length).toBeGreaterThan(0)
    expect(result.current.places.every((place) => place.category === 'SEA')).toBe(true)
  })

  it('다른 칩을 고르면 그 카테고리로 다시 불러오고, 고른 칩을 다시 눌러도 선택은 그대로다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchFavorites')
    const { result } = renderHook(() => useFavorites())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.selectCategory('NIGHT_VIEW'))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith('NIGHT_VIEW'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.places.every((place) => place.category === 'NIGHT_VIEW')).toBe(true)

    const calls = spy.mock.calls.length
    act(() => result.current.selectCategory('NIGHT_VIEW'))
    expect(result.current.category).toBe('NIGHT_VIEW')
    expect(result.current.status).toBe('ready')
    expect(spy).toHaveBeenCalledTimes(calls)
  })

  it('찜을 취소해도 목록에 남겨 두고 하트만 비운다 (바로 되돌릴 수 있게)', async () => {
    const save = vi.spyOn(placesApi, 'setPlaceFavorite')
    const { result } = renderHook(() => useFavorites())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const target = result.current.places[0]

    let saved = false
    await act(async () => {
      saved = await result.current.toggleFavorite(target.id, false)
    })

    expect(saved).toBe(true)
    expect(save).toHaveBeenCalledWith(target.id, false)
    expect(result.current.places.find((place) => place.id === target.id)?.isFavorite).toBe(false)
  })

  it('저장에 실패하면 하트를 원래대로 되돌린다', async () => {
    vi.spyOn(placesApi, 'setPlaceFavorite').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useFavorites())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const target = result.current.places[0]

    let saved = true
    await act(async () => {
      saved = await result.current.toggleFavorite(target.id, false)
    })

    expect(saved).toBe(false)
    expect(result.current.places.find((place) => place.id === target.id)?.isFavorite).toBe(true)
  })

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchFavorites').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useFavorites())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
