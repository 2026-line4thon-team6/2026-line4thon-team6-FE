import type { Coordinate, RoutePoint } from './route'

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
  recorderUserId: string
  origin: RoutePoint | null
  destination: RoutePoint | null
  routeId: string | null
  startedAt: string | null
  pausedAt: string | null
  endedAt: string | null
  endReason: DriveEndReason | null
  controlVersion: number
  metrics: DriveMetrics
  canCreateCard: boolean
  cardId: string | null
  editableUntil: string | null
  playlistId: string | null
}

export interface ActiveDrive {
  drive: Drive | null
}

export interface PrepareDriveRequest {
  title?: string
  driverUserId: string
  passengerUserId: string
  recorderUserId: string
  routeId?: string | null
}

export interface UpdateDriveRequest {
  title?: string
  routeId?: string
  expectedVersion: number
}

export interface StartDriveRequest {
  expectedVersion: number
  initialCoordinate: Coordinate
}

export interface CancelPreparedDriveRequest {
  expectedVersion: number
}

export type DriveVersionRequest = CancelPreparedDriveRequest

export interface EndDriveRequest {
  expectedVersion: number
  reason: DriveEndReason
  lastRecordedSequence: number
}

export interface DriveRequestOptions {
  coupleId: string
}

export interface IdempotentDriveRequestOptions extends DriveRequestOptions {
  idempotencyKey: string
}

export interface GpsSample {
  sequence: number
  recordedAt: string
  coordinate: Coordinate
  accuracyMeters: number
  speedMetersPerSecond: number
}

// POST /drives/{driveId}/gps-batches
export interface GpsBatchReceipt {
  acceptedSequences: number[]
  duplicateSequences: number[]
  rejected: { sequence: number; reason: string }[]
  highestContiguousSequence: number
  arrivalCandidate: boolean
  drive: Drive
  restAreaAlerts: { id: string; restAreaId: string; restAreaName: string; distanceMeters: number; message: string }[]
}
