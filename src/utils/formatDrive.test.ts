import { describe, expect, it } from 'vitest'
import { formatDistance, formatDriveTime } from './formatDrive'

describe('formatDistance', () => {
  it.each([
    [43_300, '43.3km'],
    [28_700, '28.7km'],
    [50_000, '50km'],
    [212_000, '212km'],
    [212_480, '212km'],
    [800, '0.8km'],
  ])('%sm → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected)
  })
})

describe('formatDriveTime', () => {
  it.each([
    [4_800, '1시간 20분'],
    [2_400, '40분'],
    [3_600, '1시간'],
    [11_400, '3시간 10분'],
    [20, '1분'],
  ])('%s초 → %s', (seconds, expected) => {
    expect(formatDriveTime(seconds)).toBe(expected)
  })
})
