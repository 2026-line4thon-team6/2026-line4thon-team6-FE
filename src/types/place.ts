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
