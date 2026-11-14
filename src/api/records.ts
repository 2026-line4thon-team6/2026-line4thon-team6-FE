import { mockFetchRecordMap, mockFetchRecords } from '@/mocks/records'
import type { ApiResponse } from '@/types/api'
import type { MapBounds, RecordMap, RecordPage } from '@/types/record'
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
  const bbox = bounds && [bounds.west, bounds.south, bounds.east, bounds.north].join(',')
  return apiFetch<RecordMap>(`/records/map${toQuery({ ...rest, bbox })}`)
}

export type FetchRecordsParams = Omit<FetchRecordMapParams, 'bounds'>

// GET /records — 완료 기록 목록 (최신순). date와 fromDate/toDate는 함께 보내지 않는다
export function fetchRecords(params: FetchRecordsParams = {}): Promise<ApiResponse<RecordPage>> {
  if (USE_MOCK) return mockFetchRecords(params)

  return apiFetch<RecordPage>(`/records${toQuery(params)}`)
}

// 값이 있는 항목만 쿼리 문자열로 만든다
function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const search = query.toString()
  return search ? `?${search}` : ''
}
