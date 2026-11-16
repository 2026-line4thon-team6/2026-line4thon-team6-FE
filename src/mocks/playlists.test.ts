import { describe, expect, it } from 'vitest'
import { MOCK_PLAYLIST_LIBRARY, mockFetchPlaylistLibrary } from './playlists'

// API 명세 GET /me/playlists 규칙(커서 페이지 + 전체 저장 개수 totalCount)을 목 서버가 지키는지 확인한다
describe('플레이리스트 보관함', () => {
  it('기본(20개)이면 저장한 플레이리스트를 한 페이지로 돌려준다', async () => {
    const { data } = await mockFetchPlaylistLibrary()

    expect(data).toEqual(MOCK_PLAYLIST_LIBRARY)
  })

  it('limit만큼 잘라 주고, totalCount는 페이지와 관계없이 전체 개수다', async () => {
    const { data: first } = await mockFetchPlaylistLibrary({ limit: 3 })
    expect(first.items.map(({ id }) => id)).toEqual(['ply_01', 'ply_02', 'ply_03'])
    expect(first).toMatchObject({ hasMore: true, nextCursor: '3', totalCount: 4 })

    const { data: second } = await mockFetchPlaylistLibrary({ cursor: '3', limit: 3 })
    expect(second.items.map(({ id }) => id)).toEqual(['ply_04'])
    expect(second).toMatchObject({ hasMore: false, nextCursor: null, totalCount: 4 })
  })

  it('잘못된 cursor면 400', async () => {
    await expect(mockFetchPlaylistLibrary({ cursor: '-1' })).rejects.toMatchObject({ status: 400 })
  })
})
