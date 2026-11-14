// API 명세 RadioEpisode (GET /radio/episodes · /radio/episodes/{episodeId})
export interface RadioEpisode {
  id: string
  driveId: string | null
  mode: 'USER_STORY' | 'RANDOM'
  story: string | null // 보낸 사연 원문 (RANDOM은 null)
  broadcastText: string | null // AI가 바꾼 방송 문구
  audioUrl: string | null
  audioUrlExpiresAt: string | null
  durationSeconds: number | null
  status: 'GENERATING' | 'READY' | 'FAILED'
  createdAt: string
}
