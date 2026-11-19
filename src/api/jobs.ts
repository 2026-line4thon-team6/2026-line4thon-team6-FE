import { mockCancelJob, mockGetJob } from '@/mocks/jobs'
import type { ApiResponse } from '@/types/api'
import type { Job } from '@/types/job'
import { apiFetch, isDemoId, USE_MOCK } from './client'

export function getJob(jobId: string): Promise<ApiResponse<Job>> {
  if (USE_MOCK || isDemoId(jobId)) return mockGetJob(jobId)

  return apiFetch<Job>(`/jobs/${encodeURIComponent(jobId)}`)
}

export function cancelJob(jobId: string): Promise<ApiResponse<Job>> {
  if (USE_MOCK || isDemoId(jobId)) return mockCancelJob(jobId)

  return apiFetch<Job>(`/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' })
}
