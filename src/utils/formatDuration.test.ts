import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatDuration'

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
