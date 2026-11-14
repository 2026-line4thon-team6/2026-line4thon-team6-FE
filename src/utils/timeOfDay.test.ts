import { describe, expect, it } from 'vitest'
import { getTimeOfDay } from './timeOfDay'

// 홈 배너 시간대 (Figma '시간대별 배너 이미지' 609:10169). 기기 시간대와 상관없이 한국 시간으로 나눈다
const seoul = (time: string) => new Date(`2026-11-14T${time}:00+09:00`)

describe('getTimeOfDay', () => {
  it.each([
    ['05:00', 'dawn'],
    ['08:59', 'dawn'],
    ['09:00', 'day'],
    ['16:59', 'day'],
    ['17:00', 'evening'],
    ['19:59', 'evening'],
    ['20:00', 'night'],
    ['23:59', 'night'],
    ['00:00', 'night'],
    ['04:59', 'night'],
  ])('한국 시간 %s → %s', (time, expected) => {
    expect(getTimeOfDay(seoul(time))).toBe(expected)
  })
})
