import type { Drive } from '@/types/drive'
import type { Coordinate, Route } from '@/types/route'
import type { Position } from '@/utils/location'
import ANMOK_ROUTE from './anmokRoute.json'
import { replaceMockCard } from './cards'
import { findActiveMockDrive, findMockDrive } from './drives'
import { countMockStampsOfDrive, findMockRestAreaCoordinate, hasMockStamp } from './restAreas'
import { findMockRoute } from './routes'
import { ANMOK_BEACH, MOCK_CURRENT_COORDINATE } from './search'
import { distanceBetween, encodePolyline } from './utils'

// 시연용

export const DEMO_POLYLINE = encodePolyline(ANMOK_ROUTE)
export const DEMO_ROUTE_DISTANCE_METERS = 232_227
export const DEMO_ROUTE_DURATION_SECONDS = 12_219
export const DEMO_STOP_REST_AREA_ID = 'rest_mock_11'

const DESTINATION_RADIUS = 2000
const ON_ROUTE_METERS = 500
const TICK_MS = 300
const MAX_SPEED = 3000
const MIN_SPEED = 30
const SLOWDOWN = 0.25
// 출발하고 처음 20초는 실제처럼 천천히 달리고, 이어서 10초 동안 점점 빨라진다
const SLOW_SECONDS = 20
const SPEED_UP_SECONDS = 10
const SLOW_SPEED = 15
const STOP_WAIT_MS = 3 * 60 * 1000
const DISPLAY_SPEED = 27

const POINTS: Coordinate[] = ANMOK_ROUTE
const ALONG = POINTS.reduce<number[]>(
  (sum, point, index) => [...sum, index === 0 ? 0 : sum[index - 1] + distanceBetween(POINTS[index - 1], point)],
  [],
)
const TOTAL = ALONG.at(-1) ?? 0

export const isDemoDestination = (coordinate: Coordinate) => distanceBetween(coordinate, ANMOK_BEACH) <= DESTINATION_RADIUS

export const isDemoDrive = (drive: Drive | null): drive is Drive =>
  !!drive?.routeId && findMockRoute(drive.routeId)?.polyline === DEMO_POLYLINE

export const isDemoRoute = (route: Route | null) => route?.polyline === DEMO_POLYLINE

function pointAt(meters: number): Coordinate {
  if (meters <= 0) return POINTS[0]
  if (meters >= TOTAL) return POINTS[POINTS.length - 1]
  let low = 0
  let high = ALONG.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (ALONG[mid] <= meters) low = mid
    else high = mid
  }
  const ratio = (meters - ALONG[low]) / (ALONG[high] - ALONG[low] || 1)
  const from = POINTS[low]
  const to = POINTS[high]
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * ratio,
    longitude: from.longitude + (to.longitude - from.longitude) * ratio,
  }
}

// 경로 위(500m 안)에 있으면 출발지부터 그 지점까지의 경로 거리, 아니면 null
export function alongDemoRoute(coordinate: Coordinate): number | null {
  let offset = Infinity
  let along = 0
  POINTS.forEach((point, index) => {
    const meters = distanceBetween(point, coordinate)
    if (meters < offset) {
      offset = meters
      along = ALONG[index]
    }
  })
  return offset <= ON_ROUTE_METERS ? along : null
}

interface Progress {
  driveId: string
  traveled: number
  stoppedAt: number | null
  released: boolean
  drivingSeconds: number
}

let progress: Progress | null = null
let stopAlong: number | null = null

export function resetDemoDrive() {
  progress = null
}

export function demoTraveledMeters(driveId: string) {
  return progress?.driveId === driveId ? progress.traveled : 0
}

function advance(seconds: number) {
  const drive = findActiveMockDrive()
  if (!isDemoDrive(drive)) return false
  if (progress?.driveId !== drive.id) progress = { driveId: drive.id, traveled: 0, stoppedAt: null, released: false, drivingSeconds: 0 }
  if (drive.status !== 'ACTIVE') return false

  stopAlong ??= alongDemoRoute(findMockRestAreaCoordinate(DEMO_STOP_REST_AREA_ID)) ?? TOTAL
  if (!progress.released && progress.traveled >= stopAlong) {
    progress.stoppedAt ??= Date.now()
    if (!hasMockStamp(DEMO_STOP_REST_AREA_ID) && Date.now() - progress.stoppedAt < STOP_WAIT_MS) return true
    progress.released = true
  }

  progress.drivingSeconds += seconds
  const ramp = Math.min(1, Math.max(0, (progress.drivingSeconds - SLOW_SECONDS) / SPEED_UP_SECONDS))
  const topSpeed = SLOW_SPEED + (MAX_SPEED - SLOW_SPEED) * ramp
  const target = progress.released ? TOTAL : stopAlong
  const speed = Math.min(topSpeed, Math.max(MIN_SPEED, (target - progress.traveled) * SLOWDOWN))
  progress.traveled = Math.min(target, progress.traveled + speed * seconds)
  return true
}

export function mockCurrentCoordinate(): Coordinate {
  const drive = progress && findMockDrive(progress.driveId)
  const other = findActiveMockDrive()
  if (!progress || !isDemoDrive(drive) || drive.status === 'CANCELLED' || (other && other.id !== drive.id)) {
    return MOCK_CURRENT_COORDINATE
  }
  return pointAt(progress.traveled)
}

export function mockCurrentPosition(): Position {
  const moving = !!progress && findMockDrive(progress.driveId)?.status === 'ACTIVE'
  return {
    coordinate: mockCurrentCoordinate(),
    accuracyMeters: 10,
    recordedAt: new Date().toISOString(),
    speedMetersPerSecond: moving ? DISPLAY_SPEED : null,
  }
}

const listeners = new Set<(position: Position) => void>()
let timer: ReturnType<typeof setInterval> | null = null

export function mockWatchPosition(onChange: (position: Position) => void): () => void {
  listeners.add(onChange)
  onChange(mockCurrentPosition())
  if (!timer) {
    let last = Date.now()
    timer = setInterval(() => {
      const now = Date.now()
      const moved = advance((now - last) / 1000)
      last = now
      if (!moved) return
      const position = mockCurrentPosition()
      listeners.forEach((listener) => listener(position))
    }, TICK_MS)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

// 시연은 자동 도착 없이 나가기로 끝내고, 끝나면 이 드라이브의 빈 카드를 만든다
export function endDemoDrive(drive: Drive) {
  const endedAt = new Date(drive.endedAt ?? Date.now())
  const pad = (value: number) => String(value).padStart(2, '0')
  replaceMockCard({
    id: `crd_${drive.id}`,
    driveId: drive.id,
    coupleId: drive.coupleId,
    title: drive.title,
    driveDate: `${endedAt.getFullYear()}-${pad(endedAt.getMonth() + 1)}-${pad(endedAt.getDate())}`,
    ...(drive.destination && { region: drive.destination.name, destination: drive.destination }),
    distanceMeters: Math.round(drive.metrics.distanceMeters),
    activeDurationSeconds: DEMO_ROUTE_DURATION_SECONDS,
    stampCount: countMockStampsOfDrive(drive.id),
    driverUserId: drive.driverUserId,
    editableUntil: drive.editableUntil ?? new Date(endedAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  })
}
