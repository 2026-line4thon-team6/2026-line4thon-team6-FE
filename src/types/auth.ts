import type { Me } from './me'

// 소셜 로그인 공급자. 앱 로그인은 카카오만 제공한다 (API 명세 확정 정책 D09)
export type AuthProvider = 'KAKAO'

// POST /auth/authorizations 응답
export interface AuthAuthorization {
  authSessionId: string
  authorizationUrl: string
  state: string
  expiresAt: string
}

// POST /auth/token 응답. 가입 여부는 isNewUser · user.onboardingCompleted로 판단한다
export interface AuthTokenResult {
  accessToken: string
  accessTokenExpiresInSeconds: number
  refreshToken: string
  refreshTokenExpiresInSeconds: number
  tokenType: 'Bearer'
  user: Me
  isNewUser: boolean
}

export type ConsentType = 'TERMS' | 'PRIVACY'

// PUT /me/onboarding 요청. 성별 · 커플 시작일 · 붕붕이 이름은 선택
export interface OnboardingRequest {
  nickname: string // 1~20자
  birthDate: string | null // YYYY-MM-DD
  consents: { type: ConsentType; version: string; agreed: boolean }[]
  gender?: 'MALE' | 'FEMALE' | null
  coupleStartDate?: string | null // 비우면 가입한 날부터 센다
  mascotName?: string
}
