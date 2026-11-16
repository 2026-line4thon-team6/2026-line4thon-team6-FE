import type { ApiResponse } from '@/types/api'
import type { HomeResponse, HomeSummary } from '@/types/home'
import { mockFetchPendingCards } from './cards'
import { mockFetchMe, mockFetchMyCouple } from './couples'
import { mockFetchNotifications } from './notifications'

// 홈 화면 목업 데이터 (API 연동 전 미리보기·스토리북용)
export const MOCK_HOME: HomeSummary = {
  userId: 'usr_minjun', // 목 드라이브 카드(src/mocks/cards)의 동승자
  nickname: '민준',
  mascotName: '붕붕이',
  daysTogether: 23,
  unreadNotificationCount: 1,
  couple: { id: 'cpl_01', partnerNickname: '민지' },
  context: { weather: '맑음', temperature: 22, traffic: '원활', recommendedTheme: '바다 드라이브' },
}

// GET /home 목 응답. 목 커플 · 알림 · 드라이브 카드의 현재 상태로 만든다 (연결 해제 · 알림 읽음 · 카드 저장이 홈에도 반영된다)
export async function mockFetchHome(): Promise<ApiResponse<HomeResponse>> {
  const [{ data: me }, { data: connection }, { data: notifications }, pending] = await Promise.all([
    mockFetchMe(),
    mockFetchMyCouple(),
    mockFetchNotifications({ unreadOnly: true, limit: 100 }),
    mockFetchPendingCards(),
  ])
  const couple = connection.connectionStatus === 'CONNECTED' ? connection.couple : null

  return {
    data: {
      me,
      couple,
      mascotName: couple?.mascotName ?? '붕붕이',
      unreadNotificationCount: notifications.items.length,
      activeDriveId: null,
      pendingCards: couple ? pending.data : [],
      context: {
        weather: '맑음',
        temperatureC: 22,
        traffic: '원활',
        recommendedTheme: null, // 백엔드처럼 비워 두고 FE의 하루 테마를 쓴다
        radiusMeters: 5000,
        weatherAvailable: true,
        trafficAvailable: true,
        observedAt: new Date().toISOString(),
      },
    },
    meta: pending.meta,
  }
}
