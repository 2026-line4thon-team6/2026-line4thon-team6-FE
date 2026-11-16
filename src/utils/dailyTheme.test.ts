import { describe, expect, it } from 'vitest'
import { getDailyTheme } from './dailyTheme'

const THEMES = ['바다 드라이브', '야경 드라이브', '근교 카페 드라이브', '자연 드라이브', '차박 드라이브']

describe('getDailyTheme', () => {
  it('5가지 테마를 하루에 하나씩 돌아가며 고른다', () => {
    const start = Date.parse('2026-11-16T03:00:00Z')
    const week = Array.from({ length: 6 }, (_, day) => getDailyTheme(new Date(start + day * 86_400_000)))

    expect(new Set(week.slice(0, 5))).toEqual(new Set(THEMES))
    expect(week[5]).toBe(week[0])
  })

  it('같은 날에는 같은 테마이고, 한국 시간 자정에 바뀐다', () => {
    // 한국 11/17 00:00 = UTC 11/16 15:00
    expect(getDailyTheme(new Date('2026-11-16T00:00:00+09:00'))).toBe(getDailyTheme(new Date('2026-11-16T23:59:59+09:00')))
    expect(getDailyTheme(new Date('2026-11-16T23:59:59+09:00'))).not.toBe(getDailyTheme(new Date('2026-11-17T00:00:00+09:00')))
  })
})
