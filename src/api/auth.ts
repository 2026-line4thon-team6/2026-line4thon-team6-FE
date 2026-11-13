import { apiFetch, setAccessToken, USE_MOCK } from './client'

export interface LogoutSession {
  refreshToken: string
  deviceId: string
}

// POST /auth/logout — 현재 기기만 로그아웃한다. 서버 요청이 실패해도 기기의 토큰은 지운다.
// TODO: 카카오 로그인 연동 시 저장해 둔 refreshToken · deviceId를 넘긴다 (지금은 로그인 세션이 없어 null)
export async function logout(session: LogoutSession | null, idempotencyKey: string): Promise<void> {
  try {
    if (!USE_MOCK && session) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(session),
      })
    }
  } finally {
    setAccessToken(null)
  }
}
