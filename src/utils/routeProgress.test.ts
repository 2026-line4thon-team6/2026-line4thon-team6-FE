import { describe, expect, it } from 'vitest'
import { distanceMeters } from './location'
import { alongOf, cumulativeMeters, pathBetween, pointAtAlong, remainingPath, snapToRoute } from './routeProgress'

const at = (latitude: number, longitude: number) => ({ latitude, longitude })
// 동쪽으로 갔다가 북쪽으로 꺾는 경로 (한 칸 약 88m)
const PATH = [at(37.5, 127.0), at(37.5, 127.001), at(37.5, 127.002), at(37.501, 127.002), at(37.502, 127.002)]

describe('snapToRoute', () => {
  it('경로 옆의 위치를 가장 가까운 경로 위 지점으로 옮긴다', () => {
    const snapped = snapToRoute(PATH, at(37.5002, 127.0015))!

    expect(snapped.segment).toBe(1)
    expect(snapped.point.latitude).toBeCloseTo(37.5, 6)
    expect(snapped.point.longitude).toBeCloseTo(127.0015, 6)
    expect(snapped.offRouteMeters).toBeGreaterThan(15)
    expect(snapped.offRouteMeters).toBeLessThan(30)
  })

  it('꺾인 뒤 구간에 있으면 그 구간에 붙인다', () => {
    const snapped = snapToRoute(PATH, at(37.5015, 127.0021))!

    expect(snapped.segment).toBe(3)
    expect(snapped.point.longitude).toBeCloseTo(127.002, 6)
  })

  it('지난 구간 근처로 흔들려도 앞쪽 힌트부터 찾아 뒤로 돌아가지 않는다', () => {
    // 이미 세 번째 구간까지 왔는데 GPS가 출발 근처(약 130m 뒤)로 튀어도, 한 구간 넘게 되돌아가지 않는다
    const snapped = snapToRoute(PATH, at(37.5, 127.0005), 3)!

    expect(snapped.segment).toBeGreaterThanOrEqual(2)
  })

  it('경로가 두 점보다 짧으면 붙이지 않는다', () => {
    expect(snapToRoute([at(37.5, 127)], at(37.5, 127))).toBeNull()
  })
})

describe('remainingPath', () => {
  it('지나간 구간을 빼고 현재 지점부터 도착지까지만 남긴다', () => {
    const snapped = snapToRoute(PATH, at(37.5, 127.0015))!

    expect(remainingPath(PATH, snapped)).toEqual([snapped.point, ...PATH.slice(2)])
  })
})

describe('경로를 따라 잰 거리', () => {
  const cumulative = cumulativeMeters(PATH)

  it('꼭짓점마다 경로를 따라 잰 거리를 쌓는다', () => {
    expect(cumulative[0]).toBe(0)
    expect(cumulative[1]).toBeCloseTo(88, 0)
    expect(cumulative[4]).toBeCloseTo(88 * 2 + 111 * 2, -1)
  })

  it('붙은 위치의 거리를 구하고, 거리로 다시 같은 위치를 찾는다', () => {
    const snapped = snapToRoute(PATH, at(37.5005, 127.0021))!
    const along = alongOf(PATH, cumulative, snapped)
    const back = pointAtAlong(PATH, cumulative, along)

    expect(back.segment).toBe(snapped.segment)
    expect(distanceMeters(back.point, snapped.point)).toBeLessThan(0.5)
  })

  it('두 거리 사이의 경로는 꺾인 꼭짓점을 포함한다', () => {
    const between = pathBetween(PATH, cumulative, 150, 200)

    expect(between).toHaveLength(3)
    expect(between[1]).toEqual(PATH[2])
  })

  it('범위를 벗어나면 출발점 · 도착점에 멈춘다', () => {
    expect(pointAtAlong(PATH, cumulative, -10).point).toEqual(PATH[0])
    expect(pointAtAlong(PATH, cumulative, 99999).point).toEqual(PATH[4])
    expect(pathBetween(PATH, cumulative, 50, 50)).toEqual([])
  })
})
