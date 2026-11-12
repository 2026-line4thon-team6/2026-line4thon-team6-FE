import { mockGetDriveRestAreas, mockSearchRestAreas } from '@/mocks/restAreas'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { RestArea } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import { apiFetch, USE_MOCK } from './client'

export interface SearchRestAreasParams {
  q?: string // 없으면 현재 위치 주변 휴게소
  coordinate?: Coordinate
  cursor?: string
  limit?: number
}

const pageQuery = ({ cursor, limit }: { cursor?: string; limit?: number }, query = new URLSearchParams()) => {
  if (cursor) query.set('cursor', cursor)
  if (limit) query.set('limit', String(limit))
  return query
}

const withQuery = (path: string, query: URLSearchParams) => {
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

// GET /rest-areas — 휴게소 검색
export function searchRestAreas(params: SearchRestAreasParams = {}): Promise<ApiResponse<CursorPage<RestArea>>> {
  if (USE_MOCK) return mockSearchRestAreas(params)

  const query = pageQuery(params)
  if (params.q) query.set('q', params.q)
  if (params.coordinate) {
    query.set('latitude', String(params.coordinate.latitude))
    query.set('longitude', String(params.coordinate.longitude))
  }
  return apiFetch<CursorPage<RestArea>>(withQuery('/rest-areas', query))
}

// GET /drives/{driveId}/rest-areas — 현재 경로 위 휴게소
export function getDriveRestAreas(
  driveId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ApiResponse<CursorPage<RestArea>>> {
  if (USE_MOCK) return mockGetDriveRestAreas(driveId, params)

  return apiFetch<CursorPage<RestArea>>(withQuery(`/drives/${encodeURIComponent(driveId)}/rest-areas`, pageQuery(params)))
}
