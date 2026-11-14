import { mockFetchMe, mockUpdateMe } from '@/mocks/couples'
import type { ApiResponse } from '@/types/api'
import type { Me, UpdateMeRequest } from '@/types/me'
import { apiFetch, USE_MOCK } from './client'

// GET /me — 내 계정
export function fetchMe(): Promise<ApiResponse<Me>> {
  if (USE_MOCK) return mockFetchMe()

  return apiFetch<Me>('/me')
}

// PATCH /me — 내 닉네임 · 생년월일 수정. 상대방 정보는 바꿀 수 없다
export function updateMe(body: UpdateMeRequest): Promise<ApiResponse<Me>> {
  if (USE_MOCK) return mockUpdateMe(body)

  return apiFetch<Me>('/me', { method: 'PATCH', body: JSON.stringify(body) })
}
