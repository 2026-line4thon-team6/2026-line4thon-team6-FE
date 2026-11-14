import {
  mockCancelPreparedDrive,
  mockEndDrive,
  mockGetActiveDrive,
  mockGetDrive,
  mockPauseDrive,
  mockPrepareDrive,
  mockResumeDrive,
  mockStartDrive,
  mockUpdateDrive,
} from '@/mocks/drives'
import type { ApiResponse } from '@/types/api'
import type {
  ActiveDrive,
  CancelPreparedDriveRequest,
  Drive,
  DriveRequestOptions,
  DriveVersionRequest,
  EndDriveRequest,
  IdempotentDriveRequestOptions,
  PrepareDriveRequest,
  StartDriveRequest,
  UpdateDriveRequest,
} from '@/types/drive'
import { apiFetch, USE_MOCK } from './client'

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

  return apiFetch<Drive>('/drives', { method: 'POST', headers: writeHeaders(options), body: JSON.stringify(body) })
}

export function getActiveDrive(): Promise<ApiResponse<ActiveDrive>> {
  if (USE_MOCK) return mockGetActiveDrive()

  return apiFetch<ActiveDrive>('/drives/active')
}

export function getDrive(driveId: string): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockGetDrive(driveId)

  return apiFetch<Drive>(path(driveId))
}

export function updateDrive(
  driveId: string,
  body: UpdateDriveRequest,
  options: DriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockUpdateDrive(driveId, body)

  return apiFetch<Drive>(path(driveId), { method: 'PATCH', headers: writeHeaders(options), body: JSON.stringify(body) })
}

export function startDrive(
  driveId: string,
  body: StartDriveRequest,
  options: IdempotentDriveRequestOptions,
): Promise<ApiResponse<Drive>> {
  if (USE_MOCK) return mockStartDrive(driveId, body)

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
  if (USE_MOCK) return mockPauseDrive(driveId, body)

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
  if (USE_MOCK) return mockResumeDrive(driveId, body)

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

  return apiFetch<Drive>(`${path(driveId)}/cancel`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}
