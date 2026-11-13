import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as playlistsApi from '@/api/playlists'
import usePlaylistLibrary from './usePlaylistLibrary'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePlaylistLibrary', () => {
  it('저장한 플레이리스트와 전체 개수를 불러온다', async () => {
    const { result } = renderHook(() => usePlaylistLibrary())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.playlists.map((playlist) => playlist.title)).toEqual([
      '노을처럼 따뜻한 우리',
      '바다 보며 달리는 여름',
      '초록길 힐링 드라이브',
      '근교 카페 가는 길',
    ])
    expect(result.current.totalCount).toBe(4)
  })

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    const spy = vi.spyOn(playlistsApi, 'fetchPlaylistLibrary').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => usePlaylistLibrary())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
