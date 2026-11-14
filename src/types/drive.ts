import type { Coordinate, RoutePoint } from './route'

// PREPARING → ACTIVE ⇄ PAUSED → ENDED. CANCELLED는 PREPARING에서만 갈 수 있다
export type DriveStatus = 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED'

export type DriveEndReason = 'ARRIVED' | 'USER_ENDED'

export type GpsQuality = 'OK' | 'DEGRADED' | 'MISSING'

export interface DriveMetrics {
  distanceMeters: number
  activeDurationSeconds: number
  pausedDurationSeconds: number
  estimatedArrivalAt: string | null
  lastGpsAt: string | null
  gpsQuality: GpsQuality
}

export interface Drive {
  id: string
  coupleId: string
  title: string
  status: DriveStatus
  driverUserId: string
  passengerUserId: string
  recorderUserId: string // 주행 시작(start)은 이 사람만 할 수 있다
  origin: RoutePoint | null
  destination: RoutePoint | null
  routeId: string | null
  startedAt: string | null
  pausedAt: string | null
  endedAt: string | null
  endReason: DriveEndReason | null
  controlVersion: number // 변경 요청의 expectedVersion으로 보낸다. 다르면 409 VERSION_CONFLICT
  metrics: DriveMetrics
  canCreateCard: boolean
  cardId: string | null
  editableUntil: string | null
  playlistId: string | null
}

// GET /drives/active
export interface ActiveDrive {
  drive: Drive | null
}

// POST /drives
export interface PrepareDriveRequest {
  title?: string // 비우면 서버 기본 제목
  driverUserId: string
  passengerUserId: string
  recorderUserId: string
  routeId?: string | null
}

// PATCH /drives/{driveId} — title · routeId 중 하나 이상 필요
export interface UpdateDriveRequest {
  title?: string
  routeId?: string
  expectedVersion: number
}

// POST /drives/{driveId}/start
export interface StartDriveRequest {
  expectedVersion: number
  initialCoordinate: Coordinate
}

// POST /drives/{driveId}/cancel · pause · resume
export interface CancelPreparedDriveRequest {
  expectedVersion: number
}

export type DriveVersionRequest = CancelPreparedDriveRequest

// POST /drives/{driveId}/end
export interface EndDriveRequest {
  expectedVersion: number
  reason: DriveEndReason
  lastRecordedSequence: number // 마지막으로 보낸 GPS 묶음 번호
}

export interface DriveRequestOptions {
  coupleId: string
}

export interface IdempotentDriveRequestOptions extends DriveRequestOptions {
  idempotencyKey: string // 같은 요청을 재시도할 때는 같은 키를 쓴다
}
