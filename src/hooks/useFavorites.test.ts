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
  it('처음에는 카테고리 없이 전체 찜 목록을 불러온다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchFavorites')
    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledWith(undefined)
    expect(result.current.category).toBeNull()
    expect(result.current.places.length).toBeGreaterThan(0)
  })

  it('카테고리를 고르면 그 카테고리로 다시 불러오고, 다시 고르면 전체로 돌아간다', async () => {
    const spy = vi.spyOn(placesApi, 'fetchFavorites')
    const { result } = renderHook(() => useFavorites())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.selectCategory('SEA'))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith('SEA'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.places.every((place) => place.category === 'SEA')).toBe(true)

    act(() => result.current.selectCategory('SEA'))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(undefined))
    expect(result.current.category).toBeNull()
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
