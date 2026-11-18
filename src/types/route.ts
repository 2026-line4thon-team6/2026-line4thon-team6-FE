export interface Coordinate {
  latitude: number
  longitude: number
}

export interface RoutePoint {
  placeId: string | null
  name: string
  address: string
  coordinate: Coordinate
}

export type RoutePreference = 'RECOMMENDED' | 'FASTEST' | 'SHORTEST'

export interface CreateRouteRequest {
  origin: RoutePoint
  destination: RoutePoint
  waypoints?: RoutePoint[]
  preference?: RoutePreference
}

// 선택 경로의 교통 상태 (카카오 교통 상태별 구간 거리 합산). 각각 원활 · 서행 · 정체 · 통행 불가
export type TrafficStatus = 'SMOOTH' | 'SLOW' | 'CONGESTED' | 'BLOCKED'

export interface TrafficSummary {
  status: TrafficStatus
  congestedDistanceMeters: number // 정체 구간 합산 거리(m)
}

export interface Route {
  id: string
  origin: RoutePoint
  destination: RoutePoint
  waypoints: RoutePoint[]
  polyline: string
  distanceMeters: number
  durationSeconds: number
  estimatedArrivalAt: string
  expiresAt: string
  provider: string
  trafficSummary: TrafficSummary | null // 교통 정보가 경로의 절반 미만이면 null
  warnings: string[]
}
