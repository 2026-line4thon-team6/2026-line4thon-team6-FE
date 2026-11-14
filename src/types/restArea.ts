import type { Coordinate } from './route'

export interface RestArea {
  id: string
  name: string
  highwayName: string
  direction: string | null
  coordinate: Coordinate
  distanceAlongRouteMeters: number | null
  earned: boolean
  earnedAt: string | null
  address: string | null
  distanceMeters: number | null
}

export interface RestAreaMenu {
  name: string
  imageUrl: string | null
  // 백엔드 api 먕세 확인 필요(지금은 없어용 ㅜㅜ..)
  description?: string | null
}

export interface RestAreaDetail {
  restArea: RestArea
  introduction: string | null
  menus: RestAreaMenu[]
  detailsAvailable: boolean
}

export interface StampBook {
  earnedCount: number
  catalogCount: number
  capacity: number
  items: RestArea[]
  nextCursor: string | null
  hasMore: boolean
}

export interface Stamp {
  id: string
  restArea: RestArea
  earnedAt: string
  firstDriveId: string
}

export interface StampClaimRequest {
  restAreaId: string
  method: 'GPS' | 'MANUAL'
  coordinate?: Coordinate
  observedAt?: string
}

export interface StampClaim {
  id: string
  status: 'VERIFIED' | 'PENDING' | 'REJECTED'
  reason: string | null
  alreadyEarned: boolean
  stamp: Stamp | null
  createdAt: string
  updatedAt: string
  recheckUntil: string | null
  retryAfterSeconds: number | null
}
