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

export interface RestAreaMenu {
  name: string
  imageUrl: string | null
  // Figma 메뉴 카드에 한 줄 설명이 있지만 API 명세에는 없다 — 백엔드 확인 필요
  description?: string | null
}

// GET /rest-areas/{restAreaId}
export interface RestAreaDetail {
  restArea: RestArea
  introduction: string | null
  menus: RestAreaMenu[] // 최대 4개
  detailsAvailable: boolean // 메뉴 데이터가 없으면 false
}

// GET /couples/me/stamps — 커플이 함께 모으는 도장판. items는 전체 휴게소 카탈로그
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

// POST /drives/{driveId}/stamp-claims — 서버가 주행 GPS로 방문을 확인한다
export interface StampClaimRequest {
  restAreaId: string
  method: 'GPS' | 'MANUAL' // GPS: 현재 위치로 찾기 · MANUAL: 이름으로 검색
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
