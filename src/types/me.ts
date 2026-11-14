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
export interface UpdateMeRequest {
  nickname?: string
  birthDate?: string | null
}
