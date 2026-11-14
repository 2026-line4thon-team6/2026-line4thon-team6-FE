import { mockFetchRadioEpisode, mockFetchRadioHistory } from '@/mocks/radio'
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

// GET /radio/episodes/{episodeId} — 생성자 본인의 사연 한 개 (방송 문구 · 임시 음성 URL).
// 음성 URL이 만료되면 이 API를 다시 불러 새 URL을 받는다
export function fetchRadioEpisode(episodeId: string): Promise<ApiResponse<RadioEpisode>> {
  if (USE_MOCK) return mockFetchRadioEpisode(episodeId)

  return apiFetch<RadioEpisode>(`/radio/episodes/${encodeURIComponent(episodeId)}`)
}
