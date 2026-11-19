import {
  mockCreatePlaylist,
  mockEditPlaylistTracks,
  mockGetPlaylist,
  mockSetPlaylistSaved,
} from '@/mocks/djPlaylists'
import { mockFetchPlaylistLibrary } from '@/mocks/playlists'
import type { ApiResponse, CursorParams } from '@/types/api'
import type { Job } from '@/types/job'
import type { CreatePlaylistRequest, Playlist, SavedPlaylistPage } from '@/types/playlist'
import { apiFetch, isDemoId, USE_MOCK, withQuery } from './client'
import { contentDriveId } from './drives'

// GET /me/playlists — 내가 저장 아이콘으로 보관한 플레이리스트. totalCount는 페이지와 관계없이 전체 저장 개수
export function fetchPlaylistLibrary(params: CursorParams = {}): Promise<ApiResponse<SavedPlaylistPage>> {
  if (USE_MOCK) return mockFetchPlaylistLibrary(params)

  return apiFetch<SavedPlaylistPage>(withQuery('/me/playlists', { cursor: params.cursor, limit: params.limit }))
}

export function createPlaylist(body: CreatePlaylistRequest, idempotencyKey: string): Promise<ApiResponse<Job>> {
  const driveId = body.driveId && contentDriveId(body.driveId)
  if (USE_MOCK || isDemoId(driveId)) return mockCreatePlaylist(body)

  return apiFetch<Job>('/playlists', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(driveId ? { ...body, driveId } : body),
  })
}

export function getPlaylist(playlistId: string): Promise<ApiResponse<Playlist>> {
  if (USE_MOCK || isDemoId(playlistId)) return mockGetPlaylist(playlistId)

  return apiFetch<Playlist>(`/playlists/${encodeURIComponent(playlistId)}`)
}

export function editPlaylistTracks(
  playlistId: string,
  body: { trackIds: string[]; expectedVersion: number },
): Promise<ApiResponse<Playlist>> {
  if (USE_MOCK || isDemoId(playlistId)) return mockEditPlaylistTracks(playlistId, body)

  return apiFetch<Playlist>(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function setPlaylistSaved(playlistId: string, saved: boolean): Promise<void> {
  if (USE_MOCK || isDemoId(playlistId)) return mockSetPlaylistSaved(playlistId, saved)

  await apiFetch(`/me/playlists/${encodeURIComponent(playlistId)}`, { method: saved ? 'PUT' : 'DELETE' })
}
