import { describe, expect, it } from 'vitest'
import { formatDuration, formatRegionDuration } from './formatDuration'

describe('formatDuration', () => {
  it.each([
    [null, '--'],
    [20, '약 1분'],
    [50 * 60, '약 50분'],
    [60 * 60, '약 1시간'],
    [70 * 60, '약 1시간 10분'],
    [3 * 60 * 60, '약 3시간'],
    [59 * 60 + 40, '약 1시간'],
  ])('%s초 → %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('formatRegionDuration', () => {
  it('예상 시간을 알면 "지역 · 시간"으로 보여 준다', () => {
    expect(formatRegionDuration('경기 시흥시', 3600)).toBe('경기 시흥시 · 약 1시간')
  })

  it('예상 시간을 모르면(null) 지역만 보여 준다', () => {
    expect(formatRegionDuration('경기 시흥시', null)).toBe('경기 시흥시')
  })
})
