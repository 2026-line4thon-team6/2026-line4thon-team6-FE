import { describe, expect, it } from 'vitest'
import { formatDistance, formatElapsed } from './driveStats'

describe('드라이브 정보 표시', () => {
  it('주행 시간은 1시간 전까지 분 · 초, 넘으면 시간 · 분', () => {
    expect(formatElapsed(0)).toBe('0분 0초')
    expect(formatElapsed(1938)).toBe('32분 18초')
    expect(formatElapsed(4800)).toBe('1시간 20분')
  })

  it('이동 거리는 소수점 한 자리 km', () => {
    expect(formatDistance(24600)).toBe('24.6km')
    expect(formatDistance(0)).toBe('0.0km')
  })
})
