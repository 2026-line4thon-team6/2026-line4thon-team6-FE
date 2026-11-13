import { mockFetchRadioHistory } from '@/mocks/radio'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { RadioEpisode } from '@/types/radio'
import { apiFetch, USE_MOCK } from './client'

// 검색어 최대 길이 (API 명세 q maxLength)
export const RADIO_SEARCH_MAX_LENGTH = 100

// GET /radio/episodes — 내가 보낸 사연 최신순. q는 원사연 · 방송문구에서 찾는다
export function fetchRadioHistory(q?: string): Promise<ApiResponse<CursorPage<RadioEpisode>>> {
  const keyword = q?.trim()
  if (USE_MOCK) return mockFetchRadioHistory(keyword)

  return apiFetch<CursorPage<RadioEpisode>>(`/radio/episodes${keyword ? `?q=${encodeURIComponent(keyword)}` : ''}`)
}
