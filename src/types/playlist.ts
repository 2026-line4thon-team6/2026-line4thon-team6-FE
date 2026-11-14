import type { CursorPage } from './api'

// API 명세 SavedPlaylistSummary (GET /me/playlists)
export interface SavedPlaylist {
  id: string
  title: string
  trackCount: number
  durationSeconds: number
  thumbnailUrl: string | null // 없으면 FE 기본 이미지
  // 연결된 주행. 없으면 둘 다 null
  driveId: string | null
  driveTitle: string | null
}

// totalCount는 현재 페이지가 아닌 전체 저장 개수
export interface SavedPlaylistPage extends CursorPage<SavedPlaylist> {
  totalCount: number
}

export interface PlaylistTrack {
  id: string
  providerTrackId: string
  title: string
  artist: string
  durationSeconds: number
  albumImageUrl: string | null
  providerUri: string | null
  externalUrl: string | null
  order: number
}

// GET /playlists/{playlistId}
export interface Playlist {
  id: string
  title: string
  moods: string[]
  weather: string
  genres: string[]
  targetDurationSeconds: number
  tracks: PlaylistTrack[]
  trackCount: number
  durationSeconds: number
  savedByMe: boolean
  createdAt: string
  version: number
}

// POST /playlists
export interface CreatePlaylistRequest {
  driveId?: string
  moods: string[]
  weather: string
  genres: string[]
}
