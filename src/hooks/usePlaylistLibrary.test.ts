import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as playlistsApi from '@/api/playlists'
import { mockFetchPlaylistLibrary } from '@/mocks/playlists'
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

  it('더 보기는 다음 페이지를 뒤에 붙이고, 전체 개수(totalCount)는 그대로 보여 준다', async () => {
    const spy = vi.spyOn(playlistsApi, 'fetchPlaylistLibrary')
    spy
      .mockImplementationOnce(() => mockFetchPlaylistLibrary({ limit: 3 }))
      .mockImplementationOnce(({ cursor } = {}) => mockFetchPlaylistLibrary({ cursor, limit: 3 }))
    const { result } = renderHook(() => usePlaylistLibrary())
    await waitFor(() => expect(result.current.hasMore).toBe(true))
    expect(result.current.playlists).toHaveLength(3)
    expect(result.current.totalCount).toBe(4)

    await act(() => result.current.loadMore())

    expect(spy).toHaveBeenLastCalledWith({ cursor: '3' })
    expect(result.current.playlists.map(({ id }) => id)).toEqual(['ply_01', 'ply_02', 'ply_03', 'ply_04'])
    expect(result.current.totalCount).toBe(4)
    expect(result.current.hasMore).toBe(false)
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
