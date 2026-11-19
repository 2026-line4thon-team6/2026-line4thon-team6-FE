import { isDemoDestination } from '@/mocks/demoDrive'
import { mockCreateRoute, mockGetRoute } from '@/mocks/routes'
import type { ApiResponse } from '@/types/api'
import type { CreateRouteRequest, Route } from '@/types/route'
import { apiFetch, DEMO, isDemoId, USE_MOCK } from './client'

export function createRoute(body: CreateRouteRequest, idempotencyKey: string): Promise<ApiResponse<Route>> {
  if (USE_MOCK) return mockCreateRoute(body)
  if (DEMO && !body.waypoints?.length && isDemoDestination(body.destination.coordinate)) return mockCreateRoute(body)

  return apiFetch<Route>('/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function getRoute(routeId: string): Promise<ApiResponse<Route>> {
  if (USE_MOCK || isDemoId(routeId)) return mockGetRoute(routeId)

  return apiFetch<Route>(`/routes/${encodeURIComponent(routeId)}`)
}
