import { describe, expect, it } from 'vitest'
import { MOCK_COUPLE, MOCK_ME } from '@/mocks/couples'
import type { HomeResponse } from '@/types/home'
import { getDailyTheme } from './dailyTheme'
import { emptyHomeSummary, toHomeSummary } from './homeSummary'

const NOW = new Date('2026-11-16T12:00:00+09:00')

const response = (overrides: Partial<HomeResponse> = {}): HomeResponse => ({
  me: MOCK_ME,
  couple: MOCK_COUPLE.couple,
  mascotName: '씽씽이',
  unreadNotificationCount: 2,
  activeDriveId: null,
  pendingCards: [],
  context: {
    weather: '맑음',
    temperatureC: 21.5,
    traffic: null,
    recommendedTheme: null,
    radiusMeters: 5000,
    weatherAvailable: true,
    trafficAvailable: false,
    observedAt: '2026-11-16T00:00:00Z',
  },
  ...overrides,
})

describe('toHomeSummary', () => {
  it('내 정보 · 붕붕이 이름 · 함께한 날 · 연인 닉네임 · 날씨를 홈 화면 모델로 옮긴다', () => {
    expect(toHomeSummary(response(), NOW)).toEqual({
      userId: 'usr_minjun',
      nickname: '민준',
      mascotName: '씽씽이',
      daysTogether: 23,
      unreadNotificationCount: 2,
      couple: { id: 'cpl_01', partnerNickname: '민지' },
      context: { weather: '맑음', temperature: 21.5, traffic: null, recommendedTheme: getDailyTheme(NOW) },
    })
  })

  it('서버가 추천 테마를 주면 그 값을 쓴다', () => {
    const base = response()
    const summary = toHomeSummary({ ...base, context: { ...base.context, recommendedTheme: '야경 드라이브' } }, NOW)

    expect(summary.context.recommendedTheme).toBe('야경 드라이브')
  })

  it('커플이 연결되지 않았으면 커플과 함께한 날을 비운다', () => {
    const summary = toHomeSummary(response({ couple: null, mascotName: '붕붕이' }), NOW)

    expect(summary.couple).toBeNull()
    expect(summary.daysTogether).toBeNull()
    expect(summary.mascotName).toBe('붕붕이')
  })
})

describe('emptyHomeSummary', () => {
  it('로그인한 사용자의 닉네임만 채우고 나머지는 비운다', () => {
    expect(emptyHomeSummary({ id: 'usr_a', nickname: '지수' })).toMatchObject({
      userId: 'usr_a',
      nickname: '지수',
      daysTogether: null,
      unreadNotificationCount: 0,
      couple: null,
      context: { weather: null, temperature: null, traffic: null, recommendedTheme: null },
    })
  })
})
