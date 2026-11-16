// API 명세의 장소 스키마 그대로 (GET /places/{placeId}, /places/recommendations 등)
export type PlaceCategory = 'SEA' | 'NIGHT_VIEW' | 'NEARBY_CAFE' | 'NATURE' | 'CAR_CAMPING'

export interface PlaceSummary {
  id: string // 서버 발급 불투명 ID
  name: string
  region: string // 예) 경기 시흥시
  address: string
  coordinate: { latitude: number; longitude: number }
  thumbnailUrl: string | null
  category: PlaceCategory
  hashtags: string[] // '#' 제외
  estimatedDurationSeconds: number | null // 위치를 모르면 null
  distanceMeters: number | null
  isFavorite: boolean
}

// GET /places/{placeId}
export interface PlaceDetail {
  place: PlaceSummary
  photos: string[]
  introduction: string | null
  parkingInfo: string | null
  recommendedVisitTime: string | null
  mainRoads: string[]
  previewRouteId: string | null // 위치를 모르면 null → 경로 미리보기를 보여주지 않는다
}

// GET /places/recommendations?category — 홈 '스마트 탐색 & 큐레이션'의 카테고리별 추천 (최대 7곳)
// refreshToken을 다음 요청에 보내면 다른 추천을 받는다 (지금 백엔드는 카테고리마다 3곳이라 같은 목록)
export interface PlaceRecommendations {
  category: PlaceCategory
  items: PlaceSummary[]
  refreshToken: string | null
  generatedAt: string
}

// GET /places/{placeId}/share
export interface PlaceShare {
  url: string
  access: 'PUBLIC_PLACE' | 'COUPLE_ONLY'
  expiresAt: string | null
}

// POST /places/{placeId}/send-to-partner
export interface SendToPartnerResult {
  notificationId: string
  recipientUserId: string
  sentAt: string
}

// GET /public/places/{placeId} — 로그인 없이 보는 공유 장소. 찜 여부 · 소요 시간처럼 사용자에 따라 달라지는 값은 없다
export interface PublicPlace {
  id: string
  name: string
  address: string
  coordinate: { latitude: number; longitude: number }
  thumbnailUrl: string | null
  introduction: string | null
}
