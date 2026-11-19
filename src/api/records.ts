import { mockFetchRecordCalendar, mockFetchRecordMap, mockFetchRecords } from '@/mocks/records'
import type { ApiResponse } from '@/types/api'
import type { MapBounds, RecordCalendar, RecordMap, RecordMapCard, RecordMapMarker, RecordPage } from '@/types/record'
import { recordGroupKey } from '@/utils/recordGroupKey'
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

// 한 마커(같은 목적지)에 모인 기록들 (최신순, 대표 카드가 맨 앞). 명세에 묶음 조회가 없어
// 지도와 같은 검색 조건으로 GET /records 를 넘겨 가며 groupKey가 같은 기록을 모은다
const GROUP_PAGE_LIMIT = 100
const GROUP_MAX_PAGES = 10

export async function fetchRecordGroup(
  marker: RecordMapMarker,
  filter: Pick<FetchRecordsParams, 'q' | 'date' | 'fromDate' | 'toDate'>,
): Promise<RecordMapCard[]> {
  const cards: RecordMapCard[] = []
  let cursor: string | undefined
  for (let pageCount = 0; pageCount < GROUP_MAX_PAGES; pageCount += 1) {
    const { data } = await fetchRecords({ ...filter, cursor, limit: GROUP_PAGE_LIMIT })
    cards.push(...data.items.filter((item) => recordGroupKey(item.destination) === marker.groupKey))
    if (cards.length >= marker.recordCount || !data.hasMore || !data.nextCursor) break
    cursor = data.nextCursor
  }
  // 대표 카드는 지도 응답 그대로 맨 앞에 둔다
  const rest = cards.filter((item) => item.cardId !== marker.latestCard.cardId)
  return [marker.latestCard, ...rest]
}

// GET /records/calendar — 그 달(YYYY-MM)에 기록이 있는 날짜와 개수
export function fetchRecordCalendar(month: string): Promise<ApiResponse<RecordCalendar>> {
  if (USE_MOCK) return mockFetchRecordCalendar(month)

  return apiFetch<RecordCalendar>(`/records/calendar${toQuery({ month })}`)
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
