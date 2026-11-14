import { describe, expect, it } from 'vitest'
import { formatDate, formatDateParts } from './formatDate'

describe('formatDate', () => {
  it.each([
    ['2026-11-03', '2026년 11월 3일'],
    ['2026-01-20', '2026년 1월 20일'],
    ['2025-12-31', '2025년 12월 31일'],
  ])('%s → %s', (date, expected) => {
    expect(formatDate(date)).toBe(expected)
  })

  it('형식이 맞지 않으면 그대로 돌려준다', () => {
    expect(formatDate('곧')).toBe('곧')
  })
})

describe('formatDateParts', () => {
  it('기록 목록의 날짜 칸에 쓰는 연도 · 월.일 · 요일로 나눈다', () => {
    expect(formatDateParts('2026-11-03')).toEqual({ year: '2026년', monthDay: '11.03', weekday: '화' })
    expect(formatDateParts('2026-10-24')).toEqual({ year: '2026년', monthDay: '10.24', weekday: '토' })
    expect(formatDateParts('2026-01-04')).toEqual({ year: '2026년', monthDay: '01.04', weekday: '일' })
  })

  it('형식이 맞지 않으면 원래 값을 월.일 자리에 둔다', () => {
    expect(formatDateParts('곧')).toEqual({ year: '', monthDay: '곧', weekday: '' })
  })
})
