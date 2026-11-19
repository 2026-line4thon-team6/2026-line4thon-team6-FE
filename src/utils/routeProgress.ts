import type { Coordinate } from '@/types/route'
import { bearingDegrees } from './heading'
import { distanceMeters } from './location'

export interface RouteSnap {
  // 붙은 구간의 시작점 번호 (path[segment] → path[segment + 1])
  segment: number
  // 경로 위로 옮긴 위치
  point: Coordinate
  // 실제 위치와 경로 사이 거리
  offRouteMeters: number
}

// 힌트(지난번 구간)에서 이만큼 뒤 · 앞 구간까지만 먼저 찾는다. 긴 경로에서 매번 전체를 훑지 않고, 지난 구간으로 되돌아가지 않게
const BACK_WINDOW = 1
const FORWARD_WINDOW = 400
// 힌트 근처에서 이보다 멀면 경로 전체에서 다시 찾는다 (경로를 다시 짠 경우 등)
const FULL_SEARCH_METERS = 200

const M_PER_DEG_LAT = 110_540

// 짧은 거리에서는 위경도를 평면(m)으로 펴서 계산해도 충분하다
function project(point: Coordinate, from: Coordinate, to: Coordinate) {
  const mPerDegLng = 111_320 * Math.cos((from.latitude * Math.PI) / 180)
  const ax = 0
  const ay = 0
  const bx = (to.longitude - from.longitude) * mPerDegLng
  const by = (to.latitude - from.latitude) * M_PER_DEG_LAT
  const px = (point.longitude - from.longitude) * mPerDegLng
  const py = (point.latitude - from.latitude) * M_PER_DEG_LAT
  const lengthSq = (bx - ax) ** 2 + (by - ay) ** 2
  const t = lengthSq === 0 ? 0 : Math.min(1, Math.max(0, (px * bx + py * by) / lengthSq))
  const snapped = { latitude: from.latitude + (to.latitude - from.latitude) * t, longitude: from.longitude + (to.longitude - from.longitude) * t }
  return { snapped, distance: Math.hypot(px - bx * t, py - by * t) }
}

function search(path: Coordinate[], point: Coordinate, first: number, last: number): RouteSnap {
  let best: RouteSnap = { segment: first, point: path[first], offRouteMeters: Infinity }
  for (let i = first; i <= last; i += 1) {
    const { snapped, distance } = project(point, path[i], path[i + 1])
    if (distance < best.offRouteMeters) best = { segment: i, point: snapped, offRouteMeters: distance }
  }
  return best
}

// 현재 위치를 경로 위 가장 가까운 지점으로 옮긴다. hint는 지난번에 붙은 구간 번호
export function snapToRoute(path: Coordinate[], point: Coordinate, hint = 0): RouteSnap | null {
  if (path.length < 2) return null
  const lastSegment = path.length - 2
  const near = search(path, point, Math.max(0, Math.min(hint, lastSegment) - BACK_WINDOW), Math.min(lastSegment, hint + FORWARD_WINDOW))
  if (near.offRouteMeters <= FULL_SEARCH_METERS) return near
  const all = search(path, point, 0, lastSegment)
  return all.offRouteMeters < near.offRouteMeters ? all : near
}

// 지나간 구간을 뺀 남은 경로 (현재 지점 → 도착지)
export function remainingPath(path: Coordinate[], snap: RouteSnap): Coordinate[] {
  return [snap.point, ...path.slice(snap.segment + 1)]
}

// --- 경로를 따라 잰 거리(출발점부터 m)로 위치를 다룬다. 차를 경로 위에서 부드럽게 움직일 때 쓴다 ---

// 각 꼭짓점까지 경로를 따라 잰 거리
export function cumulativeMeters(path: Coordinate[]): number[] {
  const sums = [0]
  for (let i = 1; i < path.length; i += 1) sums.push(sums[i - 1] + distanceMeters(path[i - 1], path[i]))
  return sums
}

// 경로 위로 붙은 위치가 출발점에서 경로를 따라 몇 m 지점인지
export function alongOf(path: Coordinate[], cumulative: number[], snap: RouteSnap): number {
  return cumulative[snap.segment] + distanceMeters(path[snap.segment], snap.point)
}

const lerp = (from: Coordinate, to: Coordinate, t: number): Coordinate => ({
  latitude: from.latitude + (to.latitude - from.latitude) * t,
  longitude: from.longitude + (to.longitude - from.longitude) * t,
})

// 경로를 따라 along m 지점의 위치와 그 구간 번호
export function pointAtAlong(path: Coordinate[], cumulative: number[], along: number): { point: Coordinate; segment: number } {
  const total = cumulative[cumulative.length - 1]
  if (along <= 0) return { point: path[0], segment: 0 }
  if (along >= total) return { point: path[path.length - 1], segment: path.length - 2 }
  // 이진 탐색으로 along이 들어가는 구간을 찾는다
  let low = 0
  let high = cumulative.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (cumulative[mid] <= along) low = mid
    else high = mid
  }
  const length = cumulative[high] - cumulative[low]
  return { point: length === 0 ? path[low] : lerp(path[low], path[high], (along - cumulative[low]) / length), segment: low }
}

// from m 지점부터 to m 지점까지의 경로 (꺾인 곳 포함)
export function pathBetween(path: Coordinate[], cumulative: number[], from: number, to: number): Coordinate[] {
  if (to <= from) return []
  const start = pointAtAlong(path, cumulative, from)
  const end = pointAtAlong(path, cumulative, to)
  return [start.point, ...path.slice(start.segment + 1, end.segment + 1), end.point]
}

// 경로에 붙을 때 기준으로 삼는 구간 번호. 앞으로만 늘어나고(GPS가 뒤로 튀어도 되돌아가지 않게),
// 경로가 바뀌면 처음부터 다시 센다
export interface RouteHint {
  path: Coordinate[]
  segment: number
}

export function hintFor(hint: RouteHint, path: Coordinate[]): number {
  return hint.path === path ? hint.segment : 0
}

export function advanceHint(hint: RouteHint, path: Coordinate[], snap: RouteSnap | null): RouteHint {
  if (hint.path !== path) return { path, segment: snap?.segment ?? 0 }
  if (snap && snap.segment > hint.segment) return { path, segment: snap.segment }
  return hint
}

// 경로를 따라 along m 지점에서 lookAhead m 앞을 본 방위각. 도착지에 닿아 앞이 없으면 null (방향을 그대로 둔다)
export function bearingAlong(path: Coordinate[], cumulative: number[], along: number, lookAhead: number): number | null {
  const here = pointAtAlong(path, cumulative, along).point
  const ahead = pointAtAlong(path, cumulative, along + lookAhead).point
  if (distanceMeters(here, ahead) < 1) return null
  return bearingDegrees(here, ahead)
}
