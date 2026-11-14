export interface Coordinate {
  latitude: number
  longitude: number
}

// 현재 위치처럼 장소가 아닌 좌표면 placeId가 null
export interface RoutePoint {
  placeId: string | null
  name: string
  address: string
  coordinate: Coordinate
}

export type RoutePreference = 'RECOMMENDED' | 'FASTEST' | 'SHORTEST'

// POST /routes
export interface CreateRouteRequest {
  origin: RoutePoint
  destination: RoutePoint
  waypoints?: RoutePoint[] // 최대 3개
  preference?: RoutePreference
}

export interface Route {
  id: string
  origin: RoutePoint
  destination: RoutePoint
  waypoints: RoutePoint[]
  polyline: string // 인코딩된 경로 좌표. 지도에 경로 선을 그릴 때 쓴다
  distanceMeters: number
  durationSeconds: number
  estimatedArrivalAt: string
  expiresAt: string // 지나면 410 ROUTE_EXPIRED → 다시 계산해야 한다
  provider: string
  warnings: string[]
}
