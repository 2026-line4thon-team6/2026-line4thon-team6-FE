import {
  mockFetchFavorites,
  mockFetchPlaceDetail,
  mockFetchPlaceShare,
  mockFetchPublicPlace,
  mockFetchRecommendations,
  mockSendPlaceToPartner,
  mockSetPlaceFavorite,
} from '@/mocks/places'
import type { ApiResponse, CursorPage, CursorParams } from '@/types/api'
import type {
  PlaceCategory,
  PlaceDetail,
  PlaceRecommendations,
  PlaceShare,
  PlaceSummary,
  PublicPlace,
  SendToPartnerResult,
} from '@/types/place'
import type { Coordinate } from '@/types/route'
import { apiFetch, USE_MOCK, withQuery } from './client'

const path = (placeId: string) => `/places/${encodeURIComponent(placeId)}`

// GET /places/{placeId} — 위치(위도·경도)를 함께 보내면 예상 소요 시간과 경로 미리보기가 채워진다
export function fetchPlaceDetail(
  placeId: string,
  coordinate?: { latitude: number; longitude: number },
): Promise<ApiResponse<PlaceDetail>> {
  if (USE_MOCK) return mockFetchPlaceDetail(placeId)

  const query = coordinate ? `?latitude=${coordinate.latitude}&longitude=${coordinate.longitude}` : ''
  return apiFetch<PlaceDetail>(`${path(placeId)}${query}`)
}

// GET /places/recommendations — 카테고리별 추천 장소. 좌표를 보내면 거리(distanceMeters)가 채워진다
export function fetchRecommendations(
  category: PlaceCategory,
  coordinate?: Coordinate | null,
): Promise<ApiResponse<PlaceRecommendations>> {
  if (USE_MOCK) return mockFetchRecommendations(category)

  const query = new URLSearchParams({ category })
  if (coordinate) {
    query.set('latitude', String(coordinate.latitude))
    query.set('longitude', String(coordinate.longitude))
  }
  return apiFetch<PlaceRecommendations>(`/places/recommendations?${query}`)
}

// GET /places/{placeId}/share — 장소 공유용 공개 링크
export function fetchPlaceShare(placeId: string): Promise<ApiResponse<PlaceShare>> {
  if (USE_MOCK) return mockFetchPlaceShare(placeId)

  return apiFetch<PlaceShare>(`${path(placeId)}/share`)
}

// GET /public/places/{placeId} — 공유 링크를 받은 사람이 로그인 없이 보는 장소 정보.
// 인증이 필요 없는 주소라 토큰 없이 부른다 (apiFetch는 토큰이 있을 때만 Authorization을 붙인다)
export function fetchPublicPlace(placeId: string): Promise<ApiResponse<PublicPlace>> {
  if (USE_MOCK) return mockFetchPublicPlace(placeId)

  return apiFetch<PublicPlace>(`/public${path(placeId)}`)
}

// PUT · DELETE /me/favorite-places/{placeId} — 둘 다 멱등이라 같은 요청을 반복해도 안전하다
export async function setPlaceFavorite(placeId: string, favorite: boolean): Promise<void> {
  if (USE_MOCK) return mockSetPlaceFavorite(placeId, favorite)

  await apiFetch(`/me/favorite-places/${encodeURIComponent(placeId)}`, { method: favorite ? 'PUT' : 'DELETE' })
}

// GET /me/favorite-places — 내가 찜한 장소. category를 생략하면 전체 (보관함의 카테고리 칩 필터).
// 다음 페이지는 같은 category와 함께 보내야 한다 (커서가 카테고리에 묶여 있다)
export function fetchFavorites(
  category?: PlaceCategory,
  params: CursorParams = {},
): Promise<ApiResponse<CursorPage<PlaceSummary>>> {
  if (USE_MOCK) return mockFetchFavorites(category, params)

  return apiFetch<CursorPage<PlaceSummary>>(
    withQuery('/me/favorite-places', { category, cursor: params.cursor, limit: params.limit }),
  )
}

export interface SendToPartnerOptions {
  // 같은 전송 의도의 재시도에는 같은 키를 쓴다 (알림 중복 방지)
  idempotencyKey: string
  // 현재 연결된 커플 id. 오래된 화면의 요청을 서버가 걸러낸다
  coupleId: string
}

// POST /places/{placeId}/send-to-partner — 받는 사람은 서버가 현재 연결 상대로 정한다
export function sendPlaceToPartner(
  placeId: string,
  { idempotencyKey, coupleId }: SendToPartnerOptions,
): Promise<ApiResponse<SendToPartnerResult>> {
  if (USE_MOCK) return mockSendPlaceToPartner(placeId)

  return apiFetch<SendToPartnerResult>(`${path(placeId)}/send-to-partner`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey, 'X-Couple-Id': coupleId },
  })
}
