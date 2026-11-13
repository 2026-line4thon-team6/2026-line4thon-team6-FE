import { mockFetchPlaylistLibrary } from '@/mocks/playlists'
import type { ApiResponse } from '@/types/api'
import type { SavedPlaylistPage } from '@/types/playlist'
import { apiFetch, USE_MOCK } from './client'

// GET /me/playlists — 내가 저장 아이콘으로 보관한 플레이리스트. totalCount는 전체 저장 개수
export function fetchPlaylistLibrary(): Promise<ApiResponse<SavedPlaylistPage>> {
  if (USE_MOCK) return mockFetchPlaylistLibrary()

  return apiFetch<SavedPlaylistPage>('/me/playlists')
}
