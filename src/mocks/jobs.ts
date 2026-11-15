import type { ApiResponse } from '@/types/api'
import type { Job } from '@/types/job'
import { createMeta, mockApiError } from './utils'

let generateMs = 3000
const jobs = new Map<string, { job: Job; startedAt: number; complete: () => string }>()
let count = 0

export function setMockGenerateMs(ms: number) {
  generateMs = ms
}

export function resetMockJobs() {
  generateMs = 3000
  jobs.clear()
  count = 0
}

export function mockStartJob(kind: Job['kind'], resourceType: Job['resourceType'], complete: () => string): Job {
  const job: Job = {
    id: `job_mock_${++count}`,
    kind,
    status: 'QUEUED',
    resourceType,
    resourceId: null,
    retryAfterSeconds: 1,
    createdAt: new Date().toISOString(),
    finishedAt: null,
    expiresAt: null,
    error: null,
  }
  jobs.set(job.id, { job, startedAt: Date.now(), complete })
  return structuredClone(job)
}

export async function mockGetJob(jobId: string): Promise<ApiResponse<Job>> {
  const entry = jobs.get(jobId)
  if (!entry) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '작업을 찾을 수 없어요.')
  const { job, startedAt, complete } = entry
  if (job.status === 'QUEUED' || job.status === 'RUNNING') {
    if (Date.now() - startedAt >= generateMs) {
      Object.assign(job, {
        status: 'SUCCEEDED',
        resourceId: complete(),
        finishedAt: new Date().toISOString(),
      })
    } else {
      job.status = 'RUNNING'
    }
  }
  return { data: structuredClone(job), meta: createMeta() }
}

export async function mockCancelJob(jobId: string): Promise<ApiResponse<Job>> {
  const entry = jobs.get(jobId)
  if (!entry) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '작업을 찾을 수 없어요.')
  if (entry.job.status === 'QUEUED' || entry.job.status === 'RUNNING') {
    Object.assign(entry.job, {
      status: 'CANCELLED',
      finishedAt: new Date().toISOString(),
    })
  }
  return { data: structuredClone(entry.job), meta: createMeta() }
}
