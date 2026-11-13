import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

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
