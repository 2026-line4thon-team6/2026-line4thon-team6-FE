// API 명세의 Card · Reflection · PendingCard 스키마
// (GET /drives/{driveId}/card, PATCH /cards/{cardId}/draft, PUT /cards/{cardId}/reflections/me,
//  POST /cards/{cardId}/complete, GET /cards/pending)

// UNWRITTEN: 아직 아무것도 안 씀 / DRAFT: 임시저장 / COMPLETED: 저장 완료 / EXPIRED: 24시간 지나 사라짐
export type CardStatus = 'UNWRITTEN' | 'DRAFT' | 'COMPLETED' | 'EXPIRED'

export interface CardAuthor {
  id: string
  nickname: string
  birthDate: string | null
  profileImageUrl: string | null
  provider: 'KAKAO'
}

export interface Reflection {
  author: CardAuthor
  text: string // 최대 70자
  submitted: boolean // false면 본인만 보이는 초안
  submittedAt: string | null
  updatedAt: string
  version: number // 내 소감 PUT의 expectedVersion. Card.version과 별개
}

export interface CardPhoto {
  mediaId: string
  url: string
  urlExpiresAt: string
  order: number // 0이 대표 사진
}

export interface CardPlaylist {
  id: string
  title: string
  trackCount: number
  durationSeconds: number
  thumbnailUrl: string | null // 없으면 FE 기본 이미지
}

export interface CardDestination {
  placeId: string | null
  name: string
  address: string
  coordinate: { latitude: number; longitude: number }
}

export interface Card {
  id: string
  driveId: string
  coupleId: string
  status: CardStatus
  title: string
  driveDate: string // YYYY-MM-DD (Asia/Seoul)
  region: string
  destination: CardDestination | null
  distanceMeters: number
  activeDurationSeconds: number
  stampCount: number
  playlist: CardPlaylist | null
  photos: CardPhoto[] // 최대 2장
  reflections: Reflection[]
  editableUntil: string // 이 시각까지만 쓰고 고칠 수 있다 (드라이브 종료 + 24시간)
  completedAt: string | null
  canEdit: boolean
  canDelete: boolean
  version: number // 제목 · 사진 PATCH와 complete의 expectedVersion
  // 운전자 사용자 id. 소감 칸에 운전자 · 동승자를 표시하는 데 쓴다.
  // API 명세(Card)에 아직 없는 필드 — 백엔드 확인 필요 (Drive.driverUserId와 같은 값)
  driverUserId: string | null
}

// GET /cards/pending — 24시간 안에 아직 저장하지 않은 카드 (마감이 빠른 순)
export interface PendingCard {
  cardId: string
  driveId: string
  title: string
  status: 'UNWRITTEN' | 'DRAFT'
  editableUntil: string
  remainingSeconds: number
  hasDraftContent: boolean
}

// PATCH /cards/{cardId}/draft — title · photoIds 중 하나 이상
export interface CardDraftPatch {
  title?: string
  photoIds?: string[] // 전체 순서. 첫 사진이 대표
  expectedVersion: number
}

// PUT /cards/{cardId}/reflections/me — 처음 쓸 때 expectedVersion=0
export interface ReflectionPut {
  text: string
  submitted: boolean
  expectedVersion: number
}
