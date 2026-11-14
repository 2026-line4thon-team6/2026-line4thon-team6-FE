import type { ApiResponse } from '@/types/api'
import type { CreateRouteRequest, Route } from '@/types/route'
import { createMeta, distanceBetween, encodePolyline, mockApiError } from './utils'

// 실제 길 대신 지점들을 직선으로 잇는다. 거리는 직선의 1.3배, 시간은 시속 50km로 어림한다
const ROAD_FACTOR = 1.3
const AVERAGE_SPEED_MPS = 50_000 / 3600
const EXPIRES_IN_MS = 30 * 60 * 1000

const store = new Map<string, Route>()
let routeCount = 0

export function resetMockRoutes() {
  store.clear()
  routeCount = 0
}

export function findMockRoute(routeId: string) {
  return store.get(routeId) ?? null
}

export async function mockCreateRoute({
  origin,
  destination,
  waypoints = [],
}: CreateRouteRequest): Promise<ApiResponse<Route>> {
  if (waypoints.length > 3) throw mockApiError(422, 'VALIDATION_FAILED', '경유지는 최대 3개까지 추가할 수 있어요.')

  const stops = [origin, ...waypoints, destination].map((point) => point.coordinate)
  const straight = stops.slice(1).reduce((sum, point, index) => sum + distanceBetween(stops[index], point), 0)
  const distanceMeters = Math.round(straight * ROAD_FACTOR)
  const durationSeconds = Math.round(distanceMeters / AVERAGE_SPEED_MPS)
  const now = Date.now()

  const route: Route = {
    id: `rte_mock_${++routeCount}`,
    origin,
    destination,
    waypoints,
    polyline: encodePolyline(stops),
    distanceMeters,
    durationSeconds,
    estimatedArrivalAt: new Date(now + durationSeconds * 1000).toISOString(),
    expiresAt: new Date(now + EXPIRES_IN_MS).toISOString(),
    provider: 'KAKAO',
    warnings: [],
  }
  store.set(route.id, route)
  return { data: route, meta: createMeta() }
}

export async function mockGetRoute(routeId: string): Promise<ApiResponse<Route>> {
  const route = findMockRoute(routeId)
  if (!route) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '경로를 찾을 수 없어요.')
  if (Date.parse(route.expiresAt) < Date.now()) {
    throw mockApiError(410, 'ROUTE_EXPIRED', '경로가 만료되었어요. 다시 계산해 주세요.')
  }
  return { data: route, meta: createMeta() }
}
