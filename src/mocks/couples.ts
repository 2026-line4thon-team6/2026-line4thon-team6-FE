import type { ApiMeta, ApiResponse } from '@/types/api'
import type { CoupleConnection } from '@/types/couple'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 커플 목 응답. 홈 목 데이터(민준 · 민지, D+23)와 맞춘다
let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_couple_${++requestCount}`, serverTime: new Date().toISOString() })

export const MOCK_COUPLE: CoupleConnection = {
  connectionStatus: 'CONNECTED',
  couple: {
    id: 'cpl_01',
    status: 'CONNECTED',
    members: [
      { id: 'usr_minjun', nickname: '민준', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
      { id: 'usr_minji', nickname: '민지', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
    ],
    startDate: '2026-10-20',
    daysTogether: 23,
    cumulativeDistanceMeters: 330000,
    completedCardCount: 12,
    version: 1,
    mascotName: '붕붕이',
  },
}

export async function mockFetchMyCouple(): Promise<ApiResponse<CoupleConnection>> {
  return { data: structuredClone(MOCK_COUPLE), meta: meta() }
}
