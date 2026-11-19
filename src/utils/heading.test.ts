import { describe, expect, it } from 'vitest'
import { bearingDegrees, nextCarDirection, steadyDirection, toDirection } from './heading'

const at = (latitude: number, longitude: number) => ({ latitude, longitude })
const SEOUL = at(37.5665, 126.978)

describe('bearingDegrees', () => {
  it('북쪽은 0°, 동쪽은 90°, 남쪽은 180°, 서쪽은 270°', () => {
    expect(bearingDegrees(SEOUL, at(37.5765, 126.978))).toBeCloseTo(0, 0)
    expect(bearingDegrees(SEOUL, at(37.5665, 126.988))).toBeCloseTo(90, 0)
    expect(bearingDegrees(SEOUL, at(37.5565, 126.978))).toBeCloseTo(180, 0)
    expect(bearingDegrees(SEOUL, at(37.5665, 126.968))).toBeCloseTo(270, 0)
  })
})

describe('toDirection', () => {
  it('각도를 가장 가까운 8방향으로 바꾼다', () => {
    expect(toDirection(0)).toBe('N')
    expect(toDirection(22)).toBe('N')
    expect(toDirection(23)).toBe('NE')
    expect(toDirection(90)).toBe('E')
    expect(toDirection(200)).toBe('S')
    expect(toDirection(250)).toBe('W')
    expect(toDirection(338)).toBe('N')
    expect(toDirection(-45)).toBe('NW')
  })
})

describe('nextCarDirection', () => {
  it('처음에는 이전 위치가 없어 정면(S)을 본다', () => {
    expect(nextCarDirection({ anchor: null, direction: 'S' }, SEOUL)).toEqual({ anchor: SEOUL, direction: 'S' })
  })

  it('충분히 움직이면 움직인 쪽을 보고, 그 위치를 새 기준으로 삼는다', () => {
    const east = at(37.5665, 126.9785) // 약 44m 동쪽
    expect(nextCarDirection({ anchor: SEOUL, direction: 'S' }, east)).toEqual({ anchor: east, direction: 'E' })
  })

  it('조금만 움직이면(GPS 흔들림) 방향을 그대로 둔다', () => {
    const jitter = at(37.56651, 126.97801) // 약 1.4m
    expect(nextCarDirection({ anchor: SEOUL, direction: 'NE' }, jitter)).toEqual({ anchor: SEOUL, direction: 'NE' })
  })
})

describe('steadyDirection', () => {
  it('경계 근처에서 흔들려도 지금 방향을 유지한다', () => {
    expect(steadyDirection('N', 25)).toBe('N')
    expect(steadyDirection('N', 33)).toBe('N')
    expect(steadyDirection('NE', 20)).toBe('NE')
  })

  it('경계를 충분히 넘으면 새 방향으로 바꾼다', () => {
    expect(steadyDirection('N', 36)).toBe('NE')
    expect(steadyDirection('N', 180)).toBe('S')
    expect(steadyDirection('NW', 340)).toBe('NW')
    expect(steadyDirection('NW', 10)).toBe('N')
    expect(steadyDirection('NW', 40)).toBe('NE')
  })
})
