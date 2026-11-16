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

// GET /couple-invites/me — 내 커플 코드. 연결하면 소진 · 폐기돼 조회되지 않는다(404 INVITE_NOT_FOUND)
export interface CoupleInvite {
  inviteId: string
  code: string // 불투명 문자열. 길이 · 형식을 검증하지 않는다
  expiresAt: string
  status: 'ACTIVE' | 'CONSUMED' | 'REVOKED' | 'EXPIRED'
}

// 연인 코드로 연결한 결과
export type CoupleJoinResult =
  | { status: 'connected' }
  | { status: 'restore' } // 예전에 연결했던 연인. 다시 연결할지 물은 뒤 복구(POST /couples/restore)한다
  | { status: 'failed'; message: string }
