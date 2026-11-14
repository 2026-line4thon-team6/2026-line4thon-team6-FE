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
  warnings: string[]
}
