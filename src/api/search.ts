import {
  mockDeleteSearchHistory,
  mockGetSearchHistory,
  mockReverseGeocode,
  mockSaveSearchHistory,
  mockSearchPlaces,
} from '@/mocks/search'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { PlaceSummary } from '@/types/place'
import type { Coordinate } from '@/types/route'
import type { ReverseGeocode, SearchHistoryItem } from '@/types/search'
import { apiFetch, USE_MOCK } from './client'

export interface SearchPlacesParams {
  q: string
  coordinate?: Coordinate // 보내야 distanceMeters가 채워진다
  cursor?: string
  limit?: number
}

// GET /places — 장소 검색
export function searchPlaces(params: SearchPlacesParams): Promise<ApiResponse<CursorPage<PlaceSummary>>> {
  if (USE_MOCK) return mockSearchPlaces(params)

  const query = new URLSearchParams({ q: params.q })
  if (params.coordinate) {
    query.set('latitude', String(params.coordinate.latitude))
    query.set('longitude', String(params.coordinate.longitude))
  }
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.limit) query.set('limit', String(params.limit))
  return apiFetch<CursorPage<PlaceSummary>>(`/places?${query}`)
}

// GET /me/search-history — 최근 검색어
export function getSearchHistory(): Promise<ApiResponse<SearchHistoryItem[]>> {
  if (USE_MOCK) return mockGetSearchHistory()

  return apiFetch<SearchHistoryItem[]>('/me/search-history')
}

// POST /me/search-history — 검색을 실행할 때 저장 (조회만으로는 저장되지 않는다)
export function saveSearchHistory(query: string, idempotencyKey: string): Promise<ApiResponse<SearchHistoryItem>> {
  if (USE_MOCK) return mockSaveSearchHistory(query)

  return apiFetch<SearchHistoryItem>('/me/search-history', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ query }),
  })
}

// DELETE /me/search-history/{historyId}
export async function deleteSearchHistory(historyId: string): Promise<void> {
  if (USE_MOCK) return mockDeleteSearchHistory(historyId)

  await apiFetch(`/me/search-history/${encodeURIComponent(historyId)}`, { method: 'DELETE' })
}

// GET /locations/reverse-geocode — 현재 좌표 → 출발지 주소
export function reverseGeocode(coordinate: Coordinate): Promise<ApiResponse<ReverseGeocode>> {
  if (USE_MOCK) return mockReverseGeocode(coordinate)

  const query = new URLSearchParams({
    latitude: String(coordinate.latitude),
    longitude: String(coordinate.longitude),
  })
  return apiFetch<ReverseGeocode>(`/locations/reverse-geocode?${query}`)
}
