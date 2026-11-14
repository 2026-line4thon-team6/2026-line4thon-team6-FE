import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as radioApi from '@/api/radio'
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
    expect(spy).toHaveBeenCalledWith('')
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
    expect(spy).toHaveBeenLastCalledWith('바다')
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

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioHistory').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useRadioStories())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
