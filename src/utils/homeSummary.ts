import type { HomeResponse, HomeSummary } from '@/types/home'
import type { Me } from '@/types/me'
import { getDailyTheme } from './dailyTheme'

const DEFAULT_MASCOT_NAME = '붕붕이'

// GET /home 응답을 홈 화면 모델로 바꾼다. now는 추천 테마를 고르는 날짜 (응답을 받은 시각)
export function toHomeSummary(
  { me, couple, mascotName, unreadNotificationCount, context }: HomeResponse,
  now: Date,
): HomeSummary {
  const partner = couple?.members.find((member) => member.id !== me.id) ?? null

  return {
    userId: me.id,
    nickname: me.nickname,
    mascotName,
    daysTogether: couple?.daysTogether ?? null,
    unreadNotificationCount,
    couple: couple && partner ? { id: couple.id, partnerNickname: partner.nickname } : null,
    context: {
      weather: context.weather,
      temperature: context.temperatureC,
      traffic: context.traffic,
      // 백엔드가 아직 채우지 않아 null이면 하루마다 바뀌는 FE 테마를 쓴다
      recommendedTheme: context.recommendedTheme ?? getDailyTheme(now),
    },
  }
}

// 홈을 불러오기 전 · 불러오지 못했을 때 보여 줄 값. 로그인한 사용자 정보만 쓰고 나머지는 비운다
export function emptyHomeSummary(user: Pick<Me, 'id' | 'nickname'> | null): HomeSummary {
  return {
    userId: user?.id ?? '',
    nickname: user?.nickname ?? '',
    mascotName: DEFAULT_MASCOT_NAME,
    daysTogether: null,
    unreadNotificationCount: 0,
    couple: null,
    context: { weather: null, temperature: null, traffic: null, recommendedTheme: null },
  }
}
