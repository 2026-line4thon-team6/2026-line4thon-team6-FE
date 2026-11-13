import type { RecordDestination } from './record'

// GET /cards/{cardId} — 드라이브 카드 상세. 날짜 · 지역 · 거리 · 시간 · 스탬프 · 플레이리스트는 서버가 채운다
export type CardStatus = 'UNWRITTEN' | 'DRAFT' | 'COMPLETED' | 'EXPIRED'

export interface CardPhoto {
  mediaId: string
  url: string
  urlExpiresAt: string
  order: number
}

export interface CardAuthor {
  id: string
  nickname: string
  birthDate: string | null
  profileImageUrl: string | null
  provider: 'KAKAO'
}

// 소감. 상대방이 제출하지 않은 초안은 내려오지 않고, 내 초안은 submitted=false로 내려온다
export interface CardReflection {
  author: CardAuthor
  text: string // 최대 70자
  submitted: boolean
  submittedAt: string | null
  updatedAt: string
  version: number
}

export interface CardPlaylist {
  id: string
  title: string
  trackCount: number
  durationSeconds: number
  thumbnailUrl: string | null // 없으면 FE 기본 이미지
}

export interface Card {
  id: string
  driveId: string
  coupleId: string
  status: CardStatus
  title: string
  driveDate: string // YYYY-MM-DD (Asia/Seoul)
  region: string
  destination: RecordDestination | null
  distanceMeters: number
  activeDurationSeconds: number
  stampCount: number
  playlist: CardPlaylist | null
  photos: CardPhoto[] // 최대 2장
  reflections: CardReflection[] // 최대 2개
  editableUntil: string
  completedAt: string | null
  canEdit: boolean
  canDelete: boolean
  version: number // 제목 · 사진 · 완료 · 삭제용 공통 버전
}

// GET /cards/{cardId}/share — 커플 전용 링크. 링크만으로는 볼 수 없고, 같은 커플이 로그인해야 열린다
export interface CardShare {
  url: string
  access: 'COUPLE_ONLY'
  expiresAt: string | null
}
