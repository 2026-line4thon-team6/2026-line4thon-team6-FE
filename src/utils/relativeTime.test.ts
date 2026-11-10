import { describe, expect, it } from 'vitest'
import { daysBetween, formatRelativeTime } from './relativeTime'

const NOW = '2026-11-10T12:00:00Z'

describe('formatRelativeTime', () => {
  it.each([
    ['2026-11-10T12:00:00Z', '방금 전'],
    ['2026-11-10T11:59:30Z', '방금 전'],
    ['2026-11-10T11:59:00Z', '1분 전'],
    ['2026-11-10T11:01:00Z', '59분 전'],
    ['2026-11-10T11:00:00Z', '1시간 전'],
    ['2026-11-09T19:00:00Z', '17시간 전'],
    ['2026-11-09T12:00:01Z', '23시간 전'],
    ['2026-11-09T12:00:00Z', '1일 전'],
    ['2026-11-02T12:00:00Z', '8일 전'],
    ['2026-10-11T12:00:00Z', '30일 전'],
  ])('%s → %s', (createdAt, expected) => {
    expect(formatRelativeTime(createdAt, NOW)).toBe(expected)
  })

  it('기기 시계가 달라 서버 시각보다 미래로 보이면 방금 전으로 표시한다', () => {
    expect(formatRelativeTime('2026-11-10T12:05:00Z', NOW)).toBe('방금 전')
  })
})

describe('daysBetween', () => {
  it('지난 시간을 일 단위로 내림해서 돌려준다', () => {
    expect(daysBetween('2026-11-09T12:00:01Z', NOW)).toBe(0)
    expect(daysBetween('2026-11-03T12:00:00Z', NOW)).toBe(7)
    expect(daysBetween('2026-11-03T11:59:59Z', NOW)).toBe(7)
    expect(daysBetween('2026-11-02T12:00:00Z', NOW)).toBe(8)
  })
})
