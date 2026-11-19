import {
  findActiveMockDrive,
  mockCancelPreparedDrive,
  mockEndDrive,
  mockUploadGpsBatch,
  mockGetActiveDrive,
  mockGetDrive,
  mockPauseDrive,
  mockPrepareDrive,
  mockResumeDrive,
  mockStartDrive,
  mockUpdateDrive,
} from '@/mocks/drives'
import { patchMockCard } from '@/mocks/cards'
import { findMockRoute } from '@/mocks/routes'
import type { ApiResponse } from '@/types/api'
import type { Card } from '@/types/card'
import type {
  ActiveDrive,
  CancelPreparedDriveRequest,
  Drive,
  DriveRequestOptions,
  DriveVersionRequest,
  EndDriveRequest,
  GpsBatchReceipt,
  GpsSample,
  IdempotentDriveRequestOptions,
  PrepareDriveRequest,
  StartDriveRequest,
  UpdateDriveRequest,
} from '@/types/drive'
import type { Route } from '@/types/route'
import { discardCard } from './cards'
import { apiFetch, DEMO, isDemoId, USE_MOCK } from './client'

const path = (driveId: string) => `/drives/${encodeURIComponent(driveId)}`

const writeHeaders = ({ coupleId, idempotencyKey }: DriveRequestOptions & { idempotencyKey?: string }) => ({
  'X-Couple-Id': coupleId,
  ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
})

export function prepareDrive(
  body: PrepareDriveRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockPrepareDrive(body, options)
  if (isDemoId(body.routeId)) return prepareDemoDrive(body, options)

  return apiFetch<Drive>('/drives', { method: 'POST', headers: writeHeaders(options), body: JSON.stringify(body) })
}

export function getActiveDrive(): Promise<ApiResponse<ActiveDrive>> {
  if (USE_MOCK || (DEMO && findActiveMockDrive())) return mockGetActiveDrive()

  return apiFetch<ActiveDrive>('/drives/active')
}

export function getDrive(driveId: string): Promise<ApiResponse<Drive>> {
  if (USE_MOCK || isDemoId(driveId)) return mockGetDrive(driveId)

  return apiFetch<Drive>(path(driveId))
}

export function updateDrive(
  driveId: string,
  body: UpdateDriveRequest,
  options: DriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK || isDemoId(driveId)) return mockUpdateDrive(driveId, body)
  if (isDemoId(body.routeId)) return switchToDemoDrive(driveId, body, options)

  return apiFetch<Drive>(path(driveId), { method: 'PATCH', headers: writeHeaders(options), body: JSON.stringify(body) })
}

export function startDrive(
  driveId: string,
  body: StartDriveRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockStartDrive(driveId, body)
  if (isDemoId(driveId)) return startDemoDrive(driveId, body)

  return apiFetch<Drive>(`${path(driveId)}/start`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function pauseDrive(
  driveId: string,
  body: DriveVersionRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK || isDemoId(driveId)) return mockPauseDrive(driveId, body)

  return apiFetch<Drive>(`${path(driveId)}/pause`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function resumeDrive(
  driveId: string,
  body: DriveVersionRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK || isDemoId(driveId)) return mockResumeDrive(driveId, body)

  return apiFetch<Drive>(`${path(driveId)}/resume`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function endDrive(
  driveId: string,
  body: EndDriveRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockEndDrive(driveId, body)
  if (isDemoId(driveId)) return endDemoDrive(driveId, body)

  return apiFetch<Drive>(`${path(driveId)}/end`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function cancelPreparedDrive(
  driveId: string,
  body: CancelPreparedDriveRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockCancelPreparedDrive(driveId, body)
  if (isDemoId(driveId)) return cancelDemoDrive(driveId, body)

  return apiFetch<Drive>(`${path(driveId)}/cancel`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function uploadGpsBatch(
  driveId: string,
  body: { samples: GpsSample[] },
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<GpsBatchReceipt>> {
  if (USE_MOCK || isDemoId(driveId)) return mockUploadGpsBatch(driveId, body)

  return apiFetch<GpsBatchReceipt>(`${path(driveId)}/gps-batches`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

// --- 시연(?demo=1): 목적지를 강릉 안목해변으로 정하면 그 드라이브만 목 드라이브로 돌린다 ---
// 콘텐츠(게임 · DJ 플리 · 라디오)는 실서버에 드라이브가 있어야 해서, 실서버 드라이브도 같은 목적지로 함께 출발시키고
// 콘텐츠 요청에는 실서버 드라이브 id를 쓴다. 실서버 쪽이 실패해도 시연은 목 드라이브로 계속한다

interface RealDrive {
  id: string
  coupleId: string
  controlVersion: number
}

const realDrives = new Map<string, RealDrive>()

// 콘텐츠 요청에 쓸 드라이브 id. 시연 드라이브면 함께 달리는 실서버 드라이브 id (없으면 목 드라이브 id 그대로)
export function contentDriveId(driveId: string) {
  return realDrives.get(driveId)?.id ?? driveId
}

const realHeaders = (coupleId: string) => ({ 'X-Couple-Id': coupleId, 'Idempotency-Key': crypto.randomUUID() })

const realRequest = (drive: RealDrive, action: string, body: object) =>
  apiFetch<Drive>(`${path(drive.id)}/${action}`, {
    method: 'POST',
    headers: realHeaders(drive.coupleId),
    body: JSON.stringify(body),
  })

// 목 경로와 같은 출발지 · 목적지로 실서버 경로를 만든다
async function realRouteFor(mockRouteId: string) {
  const route = findMockRoute(mockRouteId)
  if (!route) return null
  const { data } = await apiFetch<Route>('/routes', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ origin: route.origin, destination: route.destination }),
  })
  return data.id
}

const remember = (mockDriveId: string, real: Drive) =>
  realDrives.set(mockDriveId, { id: real.id, coupleId: real.coupleId, controlVersion: real.controlVersion })

async function prepareDemoDrive(body: PrepareDriveRequest, options: IdempotentDriveRequestOptions) {
  const prepared = await mockPrepareDrive(body, options)
  try {
    const routeId = await realRouteFor(body.routeId!)
    const { data: real } = await apiFetch<Drive>('/drives', {
      method: 'POST',
      headers: writeHeaders(options),
      body: JSON.stringify({ ...body, routeId: routeId ?? undefined }),
    })
    remember(prepared.data.id, real)
  } catch {
    // 실서버 드라이브 없이 목 드라이브만으로 진행한다
  }
  return prepared
}

async function switchToDemoDrive(realDriveId: string, body: UpdateDriveRequest, options: DriveRequestOptions) {
  const { data: real } = await apiFetch<Drive>(path(realDriveId))
  const prepared = await mockPrepareDrive(
    {
      title: body.title ?? real.title,
      driverUserId: real.driverUserId,
      passengerUserId: real.passengerUserId,
      recorderUserId: real.recorderUserId,
      routeId: body.routeId,
    },
    { coupleId: real.coupleId },
  )
  try {
    const routeId = await realRouteFor(body.routeId!)
    const { data: routed } = await apiFetch<Drive>(path(realDriveId), {
      method: 'PATCH',
      headers: writeHeaders(options),
      body: JSON.stringify({ routeId, expectedVersion: real.controlVersion }),
    })
    remember(prepared.data.id, routed)
  } catch {
    // 실서버 드라이브를 시연 목적지로 바꾸지 못하면 준비 중인 채로 두지 않고 취소한다
    void realRequest(real, 'cancel', { expectedVersion: real.controlVersion }).catch(() => undefined)
  }
  return prepared
}

async function startDemoDrive(driveId: string, body: StartDriveRequest) {
  const started = await mockStartDrive(driveId, body)
  const real = realDrives.get(driveId)
  if (real) {
    try {
      const { data } = await realRequest(real, 'start', { ...body, expectedVersion: real.controlVersion })
      remember(driveId, data)
    } catch {
      realDrives.delete(driveId)
      void realRequest(real, 'cancel', { expectedVersion: real.controlVersion }).catch(() => undefined)
    }
  }
  return started
}

const REAL_CARD_WAIT_MS = 5000

async function endRealDrive(real: RealDrive) {
  const { data: current } = await apiFetch<Drive>(path(real.id))
  await realRequest(real, 'end', { expectedVersion: current.controlVersion, reason: 'USER_ENDED', lastRecordedSequence: 0 })
  const { data: card } = await apiFetch<Card>(`${path(real.id)}/card`)
  return card
}

// 실서버 드라이브도 마치고, 그 드라이브에서 만든 플리를 시연 카드로 옮긴 뒤 실서버의 빈 카드는 버린다.
// 실서버가 늦으면 시연 카드를 기다리게 하지 않고 플리 없이 넘어간다
async function endDemoDrive(driveId: string, body: EndDriveRequest) {
  const ended = await mockEndDrive(driveId, body)
  const real = realDrives.get(driveId)
  realDrives.delete(driveId)
  if (real) {
    const ending = endRealDrive(real)
    void ending.then((card) => discardCard(card, crypto.randomUUID())).catch(() => undefined)
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), REAL_CARD_WAIT_MS))
    const card = await Promise.race([ending, timeout]).catch(() => null)
    if (card?.playlist) patchMockCard(ended.data.id, { playlist: card.playlist })
  }
  return ended
}

async function cancelDemoDrive(driveId: string, body: CancelPreparedDriveRequest) {
  const cancelled = await mockCancelPreparedDrive(driveId, body)
  const real = realDrives.get(driveId)
  realDrives.delete(driveId)
  if (real) void realRequest(real, 'cancel', { expectedVersion: real.controlVersion }).catch(() => undefined)
  return cancelled
}
