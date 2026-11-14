import { describe, expect, it } from 'vitest'
import { formatCardDate, formatDistance, formatDriveTime, formatPlaylistDuration, formatRemaining } from './cardFormat'

describe('formatCardDate', () => {
  it("'2026-11-03'을 '2026년 11월 3일'로 바꾼다", () => {
    expect(formatCardDate('2026-11-03')).toBe('2026년 11월 3일')
    expect(formatCardDate('2026-01-20')).toBe('2026년 1월 20일')
  })
})

describe('formatDistance', () => {
  it('미터를 소수점 한 자리 km로 바꾼다', () => {
    expect(formatDistance(43300)).toBe('43.3km')
    expect(formatDistance(12000)).toBe('12km')
    expect(formatDistance(0)).toBe('0km')
  })
})

describe('formatDriveTime', () => {
  it("주행 시간을 '1시간 20분', '45분', '2시간'으로 바꾼다", () => {
    expect(formatDriveTime(80 * 60)).toBe('1시간 20분')
    expect(formatDriveTime(45 * 60 + 20)).toBe('45분')
    expect(formatDriveTime(2 * 60 * 60)).toBe('2시간')
  })

  it('1분 미만은 0분으로 표시한다', () => {
    expect(formatDriveTime(30)).toBe('0분')
  })
})

describe('formatPlaylistDuration', () => {
  it("플레이리스트 재생 시간을 '약 54분' 형식으로 바꾼다", () => {
    expect(formatPlaylistDuration(54 * 60)).toBe('약 54분')
    expect(formatPlaylistDuration(70 * 60)).toBe('약 70분')
  })
})

describe('formatRemaining', () => {
  it('남은 초를 HH:MM:SS로 바꾼다', () => {
    expect(formatRemaining(18 * 3600)).toBe('18:00:00')
    expect(formatRemaining(3 * 3600 + 5 * 60 + 9)).toBe('03:05:09')
  })

  it('음수는 00:00:00으로 표시한다', () => {
    expect(formatRemaining(-10)).toBe('00:00:00')
  })
})
