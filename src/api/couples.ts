import {
  mockDisconnectCouple,
  mockFetchMyCouple,
  mockFetchMyInvite,
  mockRenameMascot,
  mockUpdateStartDate,
} from '@/mocks/couples'
import type { ApiResponse } from '@/types/api'
import type { Couple, CoupleConnection, CoupleInvite } from '@/types/couple'
import { apiFetch, USE_MOCK } from './client'

export interface CoupleRequestOptions {
  // 현재 연결된 커플 id. 다른 커플로 바뀐 오래된 화면의 요청을 서버가 걸러낸다
  coupleId: string
}

// GET /couples/me — 현재 커플 연결. 연결 전이면 couple=null, connectionStatus=UNLINKED
export function fetchMyCouple(): Promise<ApiResponse<CoupleConnection>> {
  if (USE_MOCK) return mockFetchMyCouple()

  return apiFetch<CoupleConnection>('/couples/me')
}

// PATCH /couples/me — 커플 시작일 변경. 미래 날짜는 422, 버전이 다르면 409 VERSION_CONFLICT
export function updateCoupleStartDate(
  startDate: string,
  expectedVersion: number,
  { coupleId }: CoupleRequestOptions,
): Promise<ApiResponse<Couple>> {
  if (USE_MOCK) return mockUpdateStartDate({ startDate, expectedVersion })

  return apiFetch<Couple>('/couples/me', {
    method: 'PATCH',
    headers: { 'X-Couple-Id': coupleId },
    body: JSON.stringify({ startDate, expectedVersion }),
  })
}

// PATCH /couples/me/mascot-name — 붕붕이명 변경 (1~20자)
export function renameMascot(
  name: string,
  expectedVersion: number,
  { coupleId }: CoupleRequestOptions,
): Promise<ApiResponse<Couple>> {
  if (USE_MOCK) return mockRenameMascot({ name, expectedVersion })

  return apiFetch<Couple>('/couples/me/mascot-name', {
    method: 'PATCH',
    headers: { 'X-Couple-Id': coupleId },
    body: JSON.stringify({ name, expectedVersion }),
  })
}

// DELETE /couples/me — 커플 연결 해제. 진행 중인 드라이브가 있으면 409 ACTIVE_DRIVE_EXISTS
export async function disconnectCouple({ coupleId }: CoupleRequestOptions): Promise<void> {
  if (USE_MOCK) return mockDisconnectCouple()

  await apiFetch('/couples/me', { method: 'DELETE', headers: { 'X-Couple-Id': coupleId } })
}

// GET /couple-invites/me — 내 커플 코드. 없거나 만료되면 404 INVITE_NOT_FOUND
export function fetchMyInvite(): Promise<ApiResponse<CoupleInvite>> {
  if (USE_MOCK) return mockFetchMyInvite()

  return apiFetch<CoupleInvite>('/couple-invites/me')
}
