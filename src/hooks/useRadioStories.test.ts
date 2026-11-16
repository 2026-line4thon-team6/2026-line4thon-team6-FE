import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as radioApi from '@/api/radio'
import { MOCK_RADIO_EPISODES, mockFetchRadioHistory } from '@/mocks/radio'
import type { RadioEpisode } from '@/types/radio'
import useRadioStories from './useRadioStories'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useRadioStories', () => {
  it('처음에는 검색어 없이 보낸 사연을 불러온다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioHistory')
    const { result } = renderHook(() => useRadioStories())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledWith('', { cursor: undefined })
    expect(result.current.episodes).toHaveLength(10)
  })

  it('입력을 멈추고 잠시 뒤에 한 번만 검색한다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioHistory')
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    vi.useFakeTimers()

    act(() => result.current.setQuery('바'))
    act(() => result.current.setQuery('바다'))
    expect(result.current.query).toBe('바다')
    await act(() => vi.advanceTimersByTimeAsync(299))
    expect(spy).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenLastCalledWith('바다', { cursor: undefined })
    vi.useRealTimers()
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.episodes.every((episode) => `${episode.story}${episode.broadcastText}`.includes('바다'))).toBe(
      true,
    )
  })

  it('앞뒤 공백만 바뀌면 다시 검색하지 않는다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioHistory')
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    vi.useFakeTimers()

    act(() => result.current.setQuery('   '))
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('더 보기는 같은 검색어와 nextCursor로 다음 페이지를 불러와 뒤에 붙인다', async () => {
    const spy = vi
      .spyOn(radioApi, 'fetchRadioHistory')
      .mockImplementation((q, { cursor } = {}) => mockFetchRadioHistory(q, { cursor, limit: 4 }))
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.hasMore).toBe(true))
    expect(result.current.episodes).toHaveLength(4)

    await act(() => result.current.loadMore())

    expect(spy).toHaveBeenLastCalledWith('', { cursor: '4' })
    expect(result.current.episodes.map(({ id }) => id)).toEqual(MOCK_RADIO_EPISODES.slice(0, 8).map(({ id }) => id))
    expect(result.current.hasMore).toBe(true)
  })

  it('검색어가 바뀌면 이전 커서를 버리고 새 검색어의 첫 페이지부터 불러온다', async () => {
    const spy = vi
      .spyOn(radioApi, 'fetchRadioHistory')
      .mockImplementation((q, { cursor } = {}) => mockFetchRadioHistory(q, { cursor, limit: 4 }))
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.hasMore).toBe(true))
    await act(() => result.current.loadMore())
    vi.useFakeTimers()

    act(() => result.current.setQuery('고마워'))
    await act(() => vi.advanceTimersByTimeAsync(300))
    vi.useRealTimers()

    expect(spy).toHaveBeenLastCalledWith('고마워', { cursor: undefined })
    await waitFor(() => expect(result.current.keyword).toBe('고마워'))
    const matches = (episode: RadioEpisode) => `${episode.story}${episode.broadcastText}`.includes('고마워')
    await waitFor(() => expect(result.current.episodes.every(matches)).toBe(true))
    expect(result.current.episodes.length).toBeLessThanOrEqual(4)
  })

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioHistory').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
