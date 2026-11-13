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
