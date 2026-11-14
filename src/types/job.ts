export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCEL_REQUESTED' | 'CANCELLED'

// GET /jobs/{jobId}
export interface Job {
  id: string
  kind: 'PLAYLIST_GENERATION' | 'RADIO_GENERATION' | 'GAME_GENERATION'
  status: JobStatus
  resourceType: 'PLAYLIST' | 'RADIO_EPISODE' | 'GAME_SESSION'
  resourceId: string | null
  retryAfterSeconds: number
  createdAt: string
  finishedAt: string | null
  expiresAt: string | null
  error: { code: string; message: string } | null
}
