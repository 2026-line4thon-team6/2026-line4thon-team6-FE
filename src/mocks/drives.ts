import type { ApiResponse } from '@/types/api'
import type {
  ActiveDrive,
  CancelPreparedDriveRequest,
  Drive,
  GpsBatchReceipt,
  GpsSample,
  DriveRequestOptions,
  DriveStatus,
  DriveVersionRequest,
  EndDriveRequest,
  PrepareDriveRequest,
  StartDriveRequest,
  UpdateDriveRequest,
} from '@/types/drive'
import { endDemoDrive, isDemoDrive } from './demoDrive'
import { findMockRoute } from './routes'
import { createMeta, distanceBetween, mockApiError } from './utils'

// 명세에 기본 제목이 없어 임시로 정했다 — 백엔드 확인 필요
export const DEFAULT_DRIVE_TITLE = '함께하는 드라이브'

const IN_PROGRESS: DriveStatus[] = ['PREPARING', 'ACTIVE', 'PAUSED']
const EDITABLE: DriveStatus[] = ['PREPARING', 'ACTIVE', 'PAUSED']

const store = new Map<string, Drive>()
let driveCount = 0

const elapsedSeconds = (since: string | null) =>
  since ? Math.max(0, Math.floor((Date.now() - Date.parse(since)) / 1000)) : 0

const activeSince = new Map<string, string>()

function withActiveTime(drive: Drive): Drive {
  if (drive.status !== 'ACTIVE') return drive
  const seconds = elapsedSeconds(activeSince.get(drive.id) ?? null)
  return { ...drive, metrics: { ...drive.metrics, activeDurationSeconds: drive.metrics.activeDurationSeconds + seconds } }
}

const gpsSamples = new Map<string, Map<number, GpsSample>>()
export const mockEndRequests: EndDriveRequest[] = []

export function resetMockDrives() {
  store.clear()
  gpsSamples.clear()
  mockEndRequests.length = 0
  activeSince.clear()
  driveCount = 0
}

export function findMockDrive(driveId: string) {
  return store.get(driveId) ?? null
}

export const findActiveMockDrive = () => [...store.values()].find((drive) => IN_PROGRESS.includes(drive.status)) ?? null

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
  if (findActiveMockDrive()) throw mockApiError(409, 'CONFLICT', '이미 진행 중인 드라이브가 있어요.')
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
  const drive = findActiveMockDrive()
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
  request: EndDriveRequest,
): Promise<ApiResponse<Drive>> {
  const { expectedVersion, reason } = request
  const drive = getInProgress(driveId, expectedVersion)
  mockEndRequests.push(request)
  const recorded = [...(gpsSamples.get(driveId)?.keys() ?? [])]
  if (reason === 'ARRIVED' && (Math.max(0, ...recorded) !== request.lastRecordedSequence || !arrivalCandidate(drive))) {
    throw mockApiError(422, 'ARRIVAL_NOT_VERIFIED', 'GPS로 목적지 도착을 확인하지 못했습니다.')
  }
  activeSince.delete(driveId)
  const endedAt = new Date()

  const ended = save({
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
  if (isDemoDrive(ended.data)) endDemoDrive(ended.data)
  return ended
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

const ARRIVAL_RADIUS = 100
const ARRIVAL_DWELL_MS = 30_000
const ARRIVAL_GAP_MS = 15_000

function arrivalCandidate(drive: Drive) {
  const destination = drive.destination?.coordinate
  if (!destination) return false
  const ordered = [...(gpsSamples.get(drive.id)?.values() ?? [])].sort((a, b) => a.sequence - b.sequence)
  let since: number | null = null
  let previous: GpsSample | null = null
  let arrived = false
  for (const sample of ordered) {
    const at = Date.parse(sample.recordedAt)
    if (distanceBetween(sample.coordinate, destination) > ARRIVAL_RADIUS) since = null
    else if (
      since === null ||
      !previous ||
      sample.sequence !== previous.sequence + 1 ||
      at - Date.parse(previous.recordedAt) > ARRIVAL_GAP_MS
    ) {
      since = at
    }
    arrived = since !== null && at - since >= ARRIVAL_DWELL_MS
    previous = sample
  }
  return arrived
}

export function mockRecordedGps(driveId: string) {
  return [...(gpsSamples.get(driveId)?.values() ?? [])]
}

export async function mockUploadGpsBatch(
  driveId: string,
  { samples }: { samples: GpsSample[] },
): Promise<ApiResponse<GpsBatchReceipt>> {
  const drive = getOrThrow(driveId)
  if (!['ACTIVE', 'PAUSED', 'ENDED'].includes(drive.status)) throw mockApiError(409, 'CONFLICT', '기록 중인 드라이브가 아니에요.')
  const history = gpsSamples.get(driveId) ?? new Map<number, GpsSample>()
  gpsSamples.set(driveId, history)

  const receipt: Omit<GpsBatchReceipt, 'drive' | 'highestContiguousSequence'> = {
    acceptedSequences: [],
    duplicateSequences: [],
    rejected: [],
    arrivalCandidate: false,
    restAreaAlerts: [],
  }
  for (const sample of samples) {
    if (history.has(sample.sequence)) receipt.duplicateSequences.push(sample.sequence)
    else if (sample.accuracyMeters > 50) receipt.rejected.push({ sequence: sample.sequence, reason: 'ACCURACY_TOO_LOW' })
    else {
      history.set(sample.sequence, sample)
      receipt.acceptedSequences.push(sample.sequence)
    }
  }

  const ordered = [...history.values()].sort((a, b) => a.sequence - b.sequence)
  const distance = ordered
    .slice(1)
    .reduce((sum, sample, index) => sum + distanceBetween(ordered[index].coordinate, sample.coordinate), 0)
  let highest = 0
  while (history.has(highest + 1)) highest += 1
  const saved = save({
    ...drive,
    metrics: { ...drive.metrics, distanceMeters: distance, lastGpsAt: ordered.at(-1)?.recordedAt ?? null },
  })
  return {
    data: { ...receipt, arrivalCandidate: !isDemoDrive(drive) && arrivalCandidate(drive), highestContiguousSequence: highest, drive: saved.data },
    meta: createMeta(),
  }
}
