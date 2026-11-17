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
    [20, '1분 미만'],
  ])('%s초 → %s', (seconds, expected) => {
    expect(formatDriveTime(seconds)).toBe(expected)
  })

  // 1분이 안 되는 짧은 드라이브를 '1분'으로 올려 보여 주지 않는다
  it("1분이 안 되면 '1분 미만'으로 표시한다", () => {
    expect(formatDriveTime(11)).toBe('1분 미만')
    expect(formatDriveTime(0)).toBe('1분 미만')
    expect(formatDriveTime(74)).toBe('1분')
  })
})
