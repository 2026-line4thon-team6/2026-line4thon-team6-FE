import {
  mockClaimStamp,
  mockGetDriveRestAreas,
  mockGetRestArea,
  mockGetStampBook,
  mockGetStampClaim,
  mockSearchRestAreas,
} from '@/mocks/restAreas'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { RestArea, RestAreaDetail, StampBook, StampClaim, StampClaimRequest } from '@/types/restArea'
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

// GET /rest-areas/{restAreaId} — 휴게소 상세 · 대표 메뉴
export function getRestArea(restAreaId: string): Promise<ApiResponse<RestAreaDetail>> {
  if (USE_MOCK) return mockGetRestArea(restAreaId)

  return apiFetch<RestAreaDetail>(`/rest-areas/${encodeURIComponent(restAreaId)}`)
}

// GET /couples/me/stamps — 도장판
export function getStampBook(params: { cursor?: string; limit?: number } = {}): Promise<ApiResponse<StampBook>> {
  if (USE_MOCK) return mockGetStampBook(params)

  return apiFetch<StampBook>(withQuery('/couples/me/stamps', pageQuery(params)))
}

// POST /drives/{driveId}/stamp-claims — 도장 찍기
export function claimStamp(
  driveId: string,
  body: StampClaimRequest,
  { coupleId, idempotencyKey }: { coupleId: string; idempotencyKey: string },
): Promise<ApiResponse<StampClaim>> {
  if (USE_MOCK) return mockClaimStamp(driveId, body)

  return apiFetch<StampClaim>(`/drives/${encodeURIComponent(driveId)}/stamp-claims`, {
    method: 'POST',
    headers: { 'X-Couple-Id': coupleId, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

// GET /stamp-claims/{claimId} — PENDING이었던 도장 결과 다시 보기
export function getStampClaim(claimId: string): Promise<ApiResponse<StampClaim>> {
  if (USE_MOCK) return mockGetStampClaim(claimId)

  return apiFetch<StampClaim>(`/stamp-claims/${encodeURIComponent(claimId)}`)
}
