// API 명세의 Couple 스키마 (GET /couples/me)

export interface CoupleMember {
  id: string
  nickname: string
  birthDate: string | null // YYYY-MM-DD
  profileImageUrl: string | null
  provider: 'KAKAO'
}

export interface Couple {
  id: string
  status: 'CONNECTED' | 'DISCONNECTED'
  members: CoupleMember[]
  startDate: string // 커플 시작일 YYYY-MM-DD
  daysTogether: number // 시작일 당일이 1
  cumulativeDistanceMeters: number
  completedCardCount: number
  version: number
  mascotName: string
}

// UNLINKED: 아직 연결한 적 없음 / DISCONNECTED: 연결을 해제함
export interface CoupleConnection {
  couple: Couple | null
  connectionStatus: 'UNLINKED' | 'CONNECTED' | 'DISCONNECTED'
}
