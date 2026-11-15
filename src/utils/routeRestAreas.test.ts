import { describe, expect, it } from 'vitest'
import { pathLength, pickAlongRoute, samplePath } from './routeRestAreas'

const PATH = [
  { latitude: 37.5547, longitude: 126.9706 },
  { latitude: 37.2636, longitude: 126.9706 },
]

describe('routeRestAreas', () => {
  it('경로를 일정 간격으로 나눈 지점을 만든다', () => {
    const points = samplePath(PATH, 10_000)
    expect(points[0]).toEqual(PATH[0])
    expect(points[points.length - 1]).toEqual(PATH[1])
    expect(points.length).toBe(Math.ceil(pathLength(PATH) / 10_000) + 1)
  })

  it('경로에서 가까운 휴게소만 출발지 순서로 남기고 중복을 없앤다', () => {
    const near = { id: 'near', coordinate: { latitude: 37.3, longitude: 126.972 } }
    const first = { id: 'first', coordinate: { latitude: 37.5, longitude: 126.9706 } }
    const far = { id: 'far', coordinate: { latitude: 37.4, longitude: 127.05 } }
    const picked = pickAlongRoute(PATH, [near, far, first, near], 1000)
    expect(picked.map(({ id }) => id)).toEqual(['first', 'near'])
  })
})
