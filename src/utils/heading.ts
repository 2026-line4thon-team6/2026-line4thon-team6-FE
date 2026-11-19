import type { Coordinate } from '@/types/route'
import { distanceMeters } from './location'

export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export type Direction = (typeof DIRECTIONS)[number]

// 이만큼 움직여야 방향을 바꾼다. GPS가 제자리에서 흔들릴 때 차가 빙글빙글 돌지 않게
const MIN_TURN_METERS = 8

const rad = (degree: number) => (degree * Math.PI) / 180
const deg = (radian: number) => (radian * 180) / Math.PI

// from → to 진행 방위각 (북 = 0°, 시계 방향, 0 ~ 360)
export function bearingDegrees(from: Coordinate, to: Coordinate): number {
  const dLng = rad(to.longitude - from.longitude)
  const y = Math.sin(dLng) * Math.cos(rad(to.latitude))
  const x =
    Math.cos(rad(from.latitude)) * Math.sin(rad(to.latitude)) -
    Math.sin(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.cos(dLng)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

// 각도를 가장 가까운 8방향으로
export function toDirection(bearing: number): Direction {
  const normalized = ((bearing % 360) + 360) % 360
  return DIRECTIONS[Math.round(normalized / 45) % 8]
}

export interface CarHeading {
  // 방향을 잰 기준 위치. 충분히 움직이면 현재 위치로 바뀐다
  anchor: Coordinate | null
  direction: Direction
}

// 새 위치를 받아 차가 볼 방향을 정한다. 처음 · 거의 안 움직였으면 이전 방향을 유지한다
export function nextCarDirection(previous: CarHeading, current: Coordinate): CarHeading {
  if (!previous.anchor) return { anchor: current, direction: previous.direction }
  if (distanceMeters(previous.anchor, current) < MIN_TURN_METERS) return previous
  return { anchor: current, direction: toDirection(bearingDegrees(previous.anchor, current)) }
}

// 방향을 바꿀 때 경계(22.5°)를 이만큼 더 넘어야 한다. 경계 근처에서 차 그림이 두 방향을 오가지 않게
const TURN_MARGIN_DEGREES = 12

// 지금 방향에서 크게 벗어났을 때만 새 방향으로 바꾼다
export function steadyDirection(current: Direction, bearing: number): Direction {
  const center = DIRECTIONS.indexOf(current) * 45
  const diff = Math.abs((((bearing - center) % 360) + 540) % 360 - 180)
  return diff <= 22.5 + TURN_MARGIN_DEGREES ? current : toDirection(bearing)
}
