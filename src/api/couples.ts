import { mockFetchMyCouple } from '@/mocks/couples'
import type { ApiResponse } from '@/types/api'
import type { CoupleConnection } from '@/types/couple'
import { apiFetch, USE_MOCK } from './client'

// GET /couples/me — 현재 커플 연결. 연결 전이면 couple=null, connectionStatus=UNLINKED
export function fetchMyCouple(): Promise<ApiResponse<CoupleConnection>> {
  if (USE_MOCK) return mockFetchMyCouple()

  return apiFetch<CoupleConnection>('/couples/me')
}
