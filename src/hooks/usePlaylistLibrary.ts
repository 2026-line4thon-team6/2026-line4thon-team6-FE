import { fetchPlaylistLibrary } from '@/api/playlists'
import type { SavedPlaylist, SavedPlaylistPage } from '@/types/playlist'
import useCursorList from './useCursorList'

// 필터가 없어 한 번만 만들어 둔다 (useCursorList는 이 함수가 바뀌면 처음부터 다시 불러온다)
const fetchPage = (cursor: string | undefined) => fetchPlaylistLibrary({ cursor })

// 플레이리스트 보관함 (GET /me/playlists). 화면에 들어올 때마다 새로 불러오고, 20개씩 더 보기로 이어 붙인다
function usePlaylistLibrary() {
  const list = useCursorList<SavedPlaylist, SavedPlaylistPage>(fetchPage)

  return {
    status: list.status,
    playlists: list.items,
    // 헤더의 개수는 불러온 목록 길이가 아니라 서버가 알려 준 전체 저장 개수
    totalCount: list.page?.totalCount ?? 0,
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    loadMore: list.loadMore,
    retry: list.retry,
  }
}

export default usePlaylistLibrary
