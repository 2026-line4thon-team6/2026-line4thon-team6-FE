import { mockFetchRecordMap } from '@/mocks/records'
import type { ApiResponse } from '@/types/api'
import type { MapBounds, RecordMap } from '@/types/record'
import { apiFetch, USE_MOCK } from './client'

export interface FetchRecordMapParams {
  bounds?: MapBounds // 지도 화면 범위. 생략하면 전체
  q?: string // 장소나 드라이브 제목 검색어
  date?: string // YYYY-MM-DD
  fromDate?: string
  toDate?: string
  cursor?: string // 이전 응답의 nextCursor. 첫 요청은 생략
  limit?: number // 기본 20, 최대 100
}

// GET /records/map — 목적지별 대표 사진 마커. 모든 페이지를 읽어야 지도가 완성된다
export function fetchRecordMap(params: FetchRecordMapParams = {}): Promise<ApiResponse<RecordMap>> {
  if (USE_MOCK) return mockFetchRecordMap(params)

  const { bounds, ...rest } = params
  const query = new URLSearchParams()
  if (bounds) query.set('bbox', [bounds.west, bounds.south, bounds.east, bounds.north].join(','))
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const search = query.toString()
  return apiFetch<RecordMap>(`/records/map${search ? `?${search}` : ''}`)
}
