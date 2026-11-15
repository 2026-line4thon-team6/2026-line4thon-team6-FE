// API 명세의 Me 스키마 (GET /me, PATCH /me)
export interface Me {
  id: string
  nickname: string // 1~20자
  birthDate: string | null // YYYY-MM-DD
  profileImageUrl: string | null
  provider: 'KAKAO'
  onboardingCompleted: boolean
  gender: 'MALE' | 'FEMALE' | null
}

// PATCH /me — 바꿀 값만 보낸다. birthDate=null은 삭제
// 빈 요청({})은 서버가 422로 거절하므로 둘 중 하나는 꼭 담도록 타입으로 막는다
export type UpdateMeRequest =
  | { nickname: string; birthDate?: string | null }
  | { nickname?: string; birthDate: string | null }
