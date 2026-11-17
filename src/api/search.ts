import {
  mockDeleteSearchHistory,
  mockGetSearchHistory,
  mockReverseGeocode,
  mockSaveSearchHistory,
  mockSearchPlaces,
} from '@/mocks/search'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { Coordinate } from '@/types/route'
import type { ReverseGeocode, SearchHistoryItem, SearchPlace } from '@/types/search'
import { apiFetch, USE_MOCK } from './client'

export interface SearchPlacesParams {
  q: string
  coordinate?: Coordinate
  cursor?: string
  limit?: number
}

export function searchPlaces(params: SearchPlacesParams): Promise<ApiResponse<CursorPage<SearchPlace>>> {
  if (USE_MOCK) return mockSearchPlaces(params)

  const query = new URLSearchParams({ q: params.q })
  if (params.coordinate) {
    query.set('latitude', String(params.coordinate.latitude))
    query.set('longitude', String(params.coordinate.longitude))
  }
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.limit) query.set('limit', String(params.limit))
  return apiFetch<CursorPage<SearchPlace>>(`/places?${query}`)
}

export function getSearchHistory(): Promise<ApiResponse<SearchHistoryItem[]>> {
  if (USE_MOCK) return mockGetSearchHistory()

  return apiFetch<SearchHistoryItem[]>('/me/search-history')
}

export function saveSearchHistory(query: string, idempotencyKey: string): Promise<ApiResponse<SearchHistoryItem>> {
  if (USE_MOCK) return mockSaveSearchHistory(query)

  return apiFetch<SearchHistoryItem>('/me/search-history', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ query }),
  })
}

export async function deleteSearchHistory(historyId: string): Promise<void> {
  if (USE_MOCK) return mockDeleteSearchHistory(historyId)

  await apiFetch(`/me/search-history/${encodeURIComponent(historyId)}`, { method: 'DELETE' })
}

export function reverseGeocode(coordinate: Coordinate): Promise<ApiResponse<ReverseGeocode>> {
  if (USE_MOCK) return mockReverseGeocode(coordinate)

  const query = new URLSearchParams({
    latitude: String(coordinate.latitude),
    longitude: String(coordinate.longitude),
  })
  return apiFetch<ReverseGeocode>(`/locations/reverse-geocode?${query}`)
}
