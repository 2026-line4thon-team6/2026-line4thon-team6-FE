import { describe, expect, it } from 'vitest'
import type { Drive } from '@/types/drive'
import { formatArrival, formatDistance, formatElapsed, formatEstimatedDuration, getDriveStats } from './driveStats'

describe('드라이브 정보 표시', () => {
  it('주행 시간은 1시간 전까지 분 · 초, 넘으면 시간 · 분', () => {
    expect(formatElapsed(0)).toBe('0분 0초')
    expect(formatElapsed(1938)).toBe('32분 18초')
    expect(formatElapsed(4800)).toBe('1시간 20분')
  })

  it('예상 주행 시간은 분까지만', () => {
    expect(formatEstimatedDuration(412)).toBe('7분')
    expect(formatEstimatedDuration(4800)).toBe('1시간 20분')
    expect(formatEstimatedDuration(10)).toBe('1분')
  })

  it('이동 거리는 소수점 한 자리 km', () => {
    expect(formatDistance(24600)).toBe('24.6km')
    expect(formatDistance(0)).toBe('0.0km')
  })

  describe('예상 도착 시간', () => {
    const drive = (estimatedArrivalAt: string | null, status: Drive['status'] = 'ACTIVE') =>
      ({
        status,
        startedAt: '2026-11-17T07:00:00.000Z',
        metrics: { distanceMeters: 0, activeDurationSeconds: 0, pausedDurationSeconds: 600, estimatedArrivalAt },
      }) as Drive
    const arrivalOf = (stats: ReturnType<typeof getDriveStats>) => stats.find(({ label }) => label === '예상 도착 시간')?.value

    it('서버 값이 있으면 그대로 쓴다', () => {
      const at = '2026-11-17T09:30:00.000Z'
      expect(arrivalOf(getDriveStats(drive(at), 0, 3600))).toBe(formatArrival(at))
    })

    it('서버 값이 없으면 출발 시각 + 경로 소요 시간 + 멈춘 시간으로 계산한다', () => {
      expect(arrivalOf(getDriveStats(drive(null), 0, 3600))).toBe(formatArrival('2026-11-17T08:10:00.000Z'))
    })

    it('출발 전이거나 경로 소요 시간을 모르면 비워 둔다', () => {
      expect(arrivalOf(getDriveStats(drive(null, 'PREPARING'), 0, 3600))).toBe('-시 -분')
      expect(arrivalOf(getDriveStats(drive(null), 0, null))).toBe('-시 -분')
    })
  })
})
