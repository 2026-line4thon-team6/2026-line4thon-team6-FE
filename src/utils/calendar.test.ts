import { describe, expect, it } from 'vitest'
import { formatMonth, getMonthWeeks, shiftMonth, todayInSeoul, toMonth } from './calendar'

describe('getMonthWeeks', () => {
  it('일요일부터 시작하는 주 단위로 나누고, 앞뒤 빈칸은 null로 채운다', () => {
    // 2026년 10월 1일은 목요일, 31일은 토요일
    const weeks = getMonthWeeks('2026-10')

    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(weeks[4]).toEqual(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'])
  })

  it('마지막 주의 남는 칸도 null로 채워 7칸을 맞춘다', () => {
    // 2026년 11월 1일은 일요일, 30일은 월요일
    const weeks = getMonthWeeks('2026-11')

    expect(weeks[0]?.[0]).toBe('2026-11-01')
    expect(weeks.at(-1)).toEqual(['2026-11-29', '2026-11-30', null, null, null, null, null])
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })

  it('윤년 2월은 29일까지 있다', () => {
    expect(getMonthWeeks('2028-02').flat().filter(Boolean).at(-1)).toBe('2028-02-29')
  })
})

describe('shiftMonth', () => {
  it('연도를 넘나들며 달을 옮긴다', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-10', 1)).toBe('2026-11')
  })
})

describe('toMonth · formatMonth', () => {
  it('날짜에서 달을 꺼내고 화면용으로 바꾼다', () => {
    expect(toMonth('2026-10-24')).toBe('2026-10')
    expect(formatMonth('2026-10')).toBe('2026년 10월')
    expect(formatMonth('2027-01')).toBe('2027년 1월')
  })
})

describe('todayInSeoul', () => {
  it('기기 시간대와 관계없이 서울 기준 날짜를 돌려준다', () => {
    // UTC 11월 12일 16시 = 서울 11월 13일 1시
    expect(todayInSeoul(new Date('2026-11-12T16:00:00Z'))).toBe('2026-11-13')
    expect(todayInSeoul(new Date('2026-11-12T14:59:00Z'))).toBe('2026-11-12')
  })
})
