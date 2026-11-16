import { mockCreateRadioEpisode, mockFetchRadioEpisode, mockFetchRadioHistory } from '@/mocks/radio'
import type { ApiResponse, CursorPage, CursorParams } from '@/types/api'
import type { Job } from '@/types/job'
import type { CreateRadioEpisodeRequest, RadioEpisode } from '@/types/radio'
import { apiFetch, USE_MOCK, withQuery } from './client'

export const RADIO_STORY_MAX_LENGTH = 300

export function createRadioEpisode(body: CreateRadioEpisodeRequest, idempotencyKey: string): Promise<ApiResponse<Job>> {
  if (USE_MOCK) return mockCreateRadioEpisode(body)

  return apiFetch<Job>('/radio/episodes', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

// 검색어 최대 길이 (API 명세 q maxLength)
export const RADIO_SEARCH_MAX_LENGTH = 100

// GET /radio/episodes — 내가 보낸 사연 최신순. q는 원사연 · 방송문구에서 찾는다.
// 다음 페이지는 같은 q와 함께 보내야 한다 (커서가 검색어에 묶여 있다)
export function fetchRadioHistory(
  q?: string,
  params: CursorParams = {},
): Promise<ApiResponse<CursorPage<RadioEpisode>>> {
  const keyword = q?.trim()
  if (USE_MOCK) return mockFetchRadioHistory(keyword, params)

  return apiFetch<CursorPage<RadioEpisode>>(
    withQuery('/radio/episodes', { q: keyword, cursor: params.cursor, limit: params.limit }),
  )
}

// GET /radio/episodes/{episodeId} — 생성자 본인의 사연 한 개 (방송 문구 · 임시 음성 URL).
// 음성 URL이 만료되면 이 API를 다시 불러 새 URL을 받는다
export function fetchRadioEpisode(episodeId: string): Promise<ApiResponse<RadioEpisode>> {
  if (USE_MOCK) return mockFetchRadioEpisode(episodeId)

  return apiFetch<RadioEpisode>(`/radio/episodes/${encodeURIComponent(episodeId)}`)
}
