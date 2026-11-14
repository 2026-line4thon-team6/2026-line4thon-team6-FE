import type { Coordinate } from './route'

export interface RestArea {
  id: string
  name: string
  highwayName: string
  direction: string | null
  coordinate: Coordinate
  distanceAlongRouteMeters: number | null // 경로를 따라 남은 거리. 경로가 없으면 null
  earned: boolean // 도장을 받았는지
  earnedAt: string | null
  address: string | null
  distanceMeters: number | null // 현재 위치에서의 거리. 위치를 모르면 null
}
