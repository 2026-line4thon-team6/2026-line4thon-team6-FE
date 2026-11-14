import type { ApiResponse } from '@/types/api'
import type {
  ActiveDrive,
  CancelPreparedDriveRequest,
  Drive,
  DriveRequestOptions,
  DriveStatus,
  DriveVersionRequest,
  EndDriveRequest,
  PrepareDriveRequest,
  StartDriveRequest,
  UpdateDriveRequest,
} from '@/types/drive'
import { findMockRoute } from './routes'
import { createMeta, mockApiError } from './utils'

// 명세에 기본 제목이 없어 임시로 정했다 — 백엔드 확인 필요
export const DEFAULT_DRIVE_TITLE = '함께하는 드라이브'

const IN_PROGRESS: DriveStatus[] = ['PREPARING', 'ACTIVE', 'PAUSED']
const EDITABLE: DriveStatus[] = ['PREPARING', 'ACTIVE', 'PAUSED']

const store = new Map<string, Drive>()
let driveCount = 0

const elapsedSeconds = (since: string | null) =>
  since ? Math.max(0, Math.floor((Date.now() - Date.parse(since)) / 1000)) : 0

// GPS가 없는 목에서는 마지막 시작 · 재개 이후 흐른 시간을 주행 시간에 더한다
const activeSince = new Map<string, string>()

function withActiveTime(drive: Drive): Drive {
  if (drive.status !== 'ACTIVE') return drive
  const seconds = elapsedSeconds(activeSince.get(drive.id) ?? null)
  return { ...drive, metrics: { ...drive.metrics, activeDurationSeconds: drive.metrics.activeDurationSeconds + seconds } }
}

export function resetMockDrives() {
  store.clear()
  activeSince.clear()
  driveCount = 0
}

export function findMockDrive(driveId: string) {
  return store.get(driveId) ?? null
}

const findActive = () => [...store.values()].find((drive) => IN_PROGRESS.includes(drive.status)) ?? null

function getOrThrow(driveId: string) {
  const drive = findMockDrive(driveId)
  if (!drive) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '드라이브를 찾을 수 없어요.')
  return drive
}

function checkVersion(drive: Drive, expectedVersion: number) {
  if (drive.controlVersion !== expectedVersion) {
    throw mockApiError(409, 'VERSION_CONFLICT', '다른 기기에서 드라이브가 바뀌었어요. 새로고침해 주세요.')
  }
}

function applyRoute(drive: Drive, routeId: string): Drive {
  const route = findMockRoute(routeId)
  if (!route) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '경로를 찾을 수 없어요.')
  if (Date.parse(route.expiresAt) < Date.now()) {
    throw mockApiError(410, 'ROUTE_EXPIRED', '경로가 만료되었어요. 다시 계산해 주세요.')
  }
  return {
    ...drive,
    routeId,
    origin: route.origin,
    destination: route.destination,
    metrics: { ...drive.metrics, estimatedArrivalAt: route.estimatedArrivalAt },
  }
}

function save(drive: Drive): ApiResponse<Drive> {
  store.set(drive.id, drive)
  return { data: withActiveTime(drive), meta: createMeta() }
}

export async function mockPrepareDrive(
  { title, driverUserId, passengerUserId, recorderUserId, routeId }: PrepareDriveRequest,
  { coupleId }: DriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  // 409 오류 코드 이름이 명세에 없어 CONFLICT로 둔다 — 백엔드 확인 필요
  if (findActive()) throw mockApiError(409, 'CONFLICT', '이미 진행 중인 드라이브가 있어요.')
  if (title && title.length > 50) throw mockApiError(422, 'VALIDATION_FAILED', '드라이브명은 50자까지 쓸 수 있어요.')

  const drive: Drive = {
    id: `drv_mock_${++driveCount}`,
    coupleId,
    title: title?.trim() || DEFAULT_DRIVE_TITLE,
    status: 'PREPARING',
    driverUserId,
    passengerUserId,
    recorderUserId,
    origin: null,
    destination: null,
    routeId: null,
    startedAt: null,
    pausedAt: null,
    endedAt: null,
    endReason: null,
    controlVersion: 1,
    metrics: {
      distanceMeters: 0,
      activeDurationSeconds: 0,
      pausedDurationSeconds: 0,
      estimatedArrivalAt: null,
      lastGpsAt: null,
      gpsQuality: 'MISSING',
    },
    canCreateCard: false,
    cardId: null,
    editableUntil: null,
    playlistId: null,
  }
  return save(routeId ? applyRoute(drive, routeId) : drive)
}

export async function mockGetActiveDrive(): Promise<ApiResponse<ActiveDrive>> {
  const drive = findActive()
  return { data: { drive: drive && withActiveTime(drive) }, meta: createMeta() }
}

export async function mockGetDrive(driveId: string): Promise<ApiResponse<Drive>> {
  return { data: withActiveTime(getOrThrow(driveId)), meta: createMeta() }
}

export async function mockUpdateDrive(
  driveId: string,
  { title, routeId, expectedVersion }: UpdateDriveRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getOrThrow(driveId)
  if (!EDITABLE.includes(drive.status)) throw mockApiError(409, 'CONFLICT', '끝난 드라이브는 바꿀 수 없어요.')
  checkVersion(drive, expectedVersion)
  if (title === undefined && routeId === undefined) {
    throw mockApiError(422, 'VALIDATION_FAILED', '바꿀 드라이브명이나 경로를 보내 주세요.')
  }
  if (title !== undefined && title.length > 50) {
    throw mockApiError(422, 'VALIDATION_FAILED', '드라이브명은 50자까지 쓸 수 있어요.')
  }

  let next: Drive = { ...drive, controlVersion: drive.controlVersion + 1 }
  if (title !== undefined) next.title = title.trim() || DEFAULT_DRIVE_TITLE
  if (routeId !== undefined) next = applyRoute(next, routeId)
  return save(next)
}

export async function mockStartDrive(
  driveId: string,
  { expectedVersion }: StartDriveRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getOrThrow(driveId)
  if (drive.status !== 'PREPARING') throw mockApiError(409, 'CONFLICT', '이미 시작한 드라이브예요.')
  checkVersion(drive, expectedVersion)
  if (!drive.routeId || !drive.destination) {
    throw mockApiError(422, 'VALIDATION_FAILED', '목적지를 정한 뒤 출발할 수 있어요.')
  }

  const startedAt = new Date().toISOString()
  activeSince.set(driveId, startedAt)

  return save({
    ...drive,
    status: 'ACTIVE',
    startedAt,
    controlVersion: drive.controlVersion + 1,
  })
}

function getInProgress(driveId: string, expectedVersion: number) {
  const drive = getOrThrow(driveId)
  if (drive.status !== 'ACTIVE' && drive.status !== 'PAUSED') {
    throw mockApiError(409, 'CONFLICT', '주행 중인 드라이브가 아니에요.')
  }
  checkVersion(drive, expectedVersion)
  return withActiveTime(drive)
}

export async function mockPauseDrive(
  driveId: string,
  { expectedVersion }: DriveVersionRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getInProgress(driveId, expectedVersion)
  if (drive.status !== 'ACTIVE') throw mockApiError(409, 'CONFLICT', '이미 기록이 중단되었어요.')
  activeSince.delete(driveId)

  return save({
    ...drive,
    status: 'PAUSED',
    pausedAt: new Date().toISOString(),
    controlVersion: drive.controlVersion + 1,
  })
}

export async function mockResumeDrive(
  driveId: string,
  { expectedVersion }: DriveVersionRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getInProgress(driveId, expectedVersion)
  if (drive.status !== 'PAUSED') throw mockApiError(409, 'CONFLICT', '이미 주행 중이에요.')
  const now = new Date().toISOString()
  activeSince.set(driveId, now)

  return save({
    ...drive,
    status: 'ACTIVE',
    pausedAt: null,
    metrics: {
      ...drive.metrics,
      pausedDurationSeconds: drive.metrics.pausedDurationSeconds + elapsedSeconds(drive.pausedAt),
    },
    controlVersion: drive.controlVersion + 1,
  })
}

export async function mockEndDrive(
  driveId: string,
  { expectedVersion, reason }: EndDriveRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getInProgress(driveId, expectedVersion)
  activeSince.delete(driveId)
  const endedAt = new Date()

  return save({
    ...drive,
    status: 'ENDED',
    pausedAt: null,
    endedAt: endedAt.toISOString(),
    endReason: reason,
    metrics: {
      ...drive.metrics,
      pausedDurationSeconds: drive.metrics.pausedDurationSeconds + elapsedSeconds(drive.pausedAt),
    },
    canCreateCard: true,
    editableUntil: new Date(endedAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    controlVersion: drive.controlVersion + 1,
  })
}

export async function mockCancelPreparedDrive(
  driveId: string,
  { expectedVersion }: CancelPreparedDriveRequest,
): Promise<ApiResponse<Drive>> {
  const drive = getOrThrow(driveId)
  if (drive.status !== 'PREPARING') throw mockApiError(409, 'CONFLICT', '시작한 드라이브는 취소할 수 없어요.')
  checkVersion(drive, expectedVersion)

  return save({ ...drive, status: 'CANCELLED', controlVersion: drive.controlVersion + 1 })
}
