import type { Coordinate } from '@/types/route'
import { distanceMeters } from './location'

const toXY = (origin: Coordinate, point: Coordinate) => {
  const R = 6371000
  const rad = Math.PI / 180
  return {
    x: (point.longitude - origin.longitude) * rad * R * Math.cos(origin.latitude * rad),
    y: (point.latitude - origin.latitude) * rad * R,
  }
}

export function pathLength(path: Coordinate[]) {
  return path.slice(1).reduce((sum, point, index) => sum + distanceMeters(path[index], point), 0)
}

export function samplePath(path: Coordinate[], spacing: number): Coordinate[] {
  if (path.length === 0) return []
  const points = [path[0]]
  let carried = 0
  for (let index = 1; index < path.length; index++) {
    const from = path[index - 1]
    const to = path[index]
    const length = distanceMeters(from, to)
    let at = spacing - carried
    while (at <= length) {
      const ratio = at / length
      points.push({
        latitude: from.latitude + (to.latitude - from.latitude) * ratio,
        longitude: from.longitude + (to.longitude - from.longitude) * ratio,
      })
      at += spacing
    }
    carried = (carried + length) % spacing
  }
  const last = path[path.length - 1]
  if (distanceMeters(points[points.length - 1], last) > 1000) points.push(last)
  return points
}

export function locateOnPath(point: Coordinate, path: Coordinate[]) {
  let best = { distance: Infinity, along: 0 }
  let travelled = 0
  for (let index = 1; index < path.length; index++) {
    const from = path[index - 1]
    const a = toXY(from, path[index])
    const p = toXY(from, point)
    const lengthSq = a.x * a.x + a.y * a.y
    const t = lengthSq ? Math.max(0, Math.min(1, (p.x * a.x + p.y * a.y) / lengthSq)) : 0
    const distance = Math.hypot(p.x - a.x * t, p.y - a.y * t)
    const segment = Math.sqrt(lengthSq)
    if (distance < best.distance) best = { distance, along: travelled + segment * t }
    travelled += segment
  }
  return best
}

export function pickAlongRoute<T extends { id: string; coordinate: Coordinate }>(
  path: Coordinate[],
  areas: T[],
  maxMeters: number,
): T[] {
  const unique = new Map(areas.map((area) => [area.id, area]))
  return [...unique.values()]
    .map((area) => ({ area, ...locateOnPath(area.coordinate, path) }))
    .filter(({ distance }) => distance <= maxMeters)
    .sort((a, b) => a.along - b.along)
    .map(({ area }) => area)
}
