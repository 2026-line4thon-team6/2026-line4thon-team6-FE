import { mockCreateRoute, mockGetRoute } from '@/mocks/routes'
import type { ApiResponse } from '@/types/api'
import type { CreateRouteRequest, Route } from '@/types/route'
import { apiFetch, USE_MOCK } from './client'

export function createRoute(body: CreateRouteRequest, idempotencyKey: string): Promise<ApiResponse<Route>> {
  if (USE_MOCK) return mockCreateRoute(body)

  return apiFetch<Route>('/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function getRoute(routeId: string): Promise<ApiResponse<Route>> {
  if (USE_MOCK) return mockGetRoute(routeId)

  return apiFetch<Route>(`/routes/${encodeURIComponent(routeId)}`)
}
