import { describe, expect, it } from 'vitest'
import { formatBirthInput, toDotDate, toIsoDate } from './coupleDate'

describe('toDotDate', () => {
  it("'2026-10-20'을 '2026.10.20'으로 바꾼다", () => {
    expect(toDotDate('2026-10-20')).toBe('2026.10.20')
  })
})

describe('formatBirthInput', () => {
  it('숫자만 남겨 YYYY.MM.DD 모양으로 점을 넣는다', () => {
    expect(formatBirthInput('2003')).toBe('2003')
    expect(formatBirthInput('20030')).toBe('2003.0')
    expect(formatBirthInput('20030506')).toBe('2003.05.06')
    expect(formatBirthInput('2003-05-06 99')).toBe('2003.05.06')
  })
})

describe('toIsoDate', () => {
  it("'YYYY.MM.DD'를 'YYYY-MM-DD'로 바꾼다", () => {
    expect(toIsoDate('2003.05.06', '2026-11-13')).toBe('2003-05-06')
  })

  it('없는 날짜 · max 이후 · 형식이 다르면 null', () => {
    expect(toIsoDate('2003.02.30', '2026-11-13')).toBeNull()
    expect(toIsoDate('2026.11.14', '2026-11-13')).toBeNull()
    expect(toIsoDate('2003.5.6', '2026-11-13')).toBeNull()
  })
})
