import {
  mockCreateInvite,
  mockDisconnectCouple,
  mockFetchMyCouple,
  mockFetchMyInvite,
  mockJoinCouple,
  mockRenameMascot,
  mockRestoreCouple,
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

// PATCH /couples/me — 커플 시작일 변경. 미래 날짜는 422 INVALID_START_DATE, 버전이 다르면 409 VERSION_CONFLICT
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

// GET /couple-invites/me — 내 커플 코드. 없거나 만료됐거나, 연결하면서 소진 · 폐기됐으면 404 INVITE_NOT_FOUND
export function fetchMyInvite(): Promise<ApiResponse<CoupleInvite>> {
  if (USE_MOCK) return mockFetchMyInvite()

  return apiFetch<CoupleInvite>('/couple-invites/me')
}

// POST /couple-invites — 내 초대 코드 발급. 유효한 코드가 있으면 그대로 돌려준다(24시간 유효). 이미 연결돼 있으면 409 ALREADY_COUPLED
export function createCoupleInvite(idempotencyKey: string): Promise<ApiResponse<CoupleInvite>> {
  if (USE_MOCK) return mockCreateInvite()

  return apiFetch<CoupleInvite>('/couple-invites', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } })
}

// POST /couples — 연인의 초대 코드로 연결. 코드는 길이 · 형식을 검증하지 않고 앞뒤 공백만 지워 보낸다
// 422 INVALID_INVITE · SELF_INVITE · INVALID_START_DATE, 409 INVITE_CONSUMED · ALREADY_COUPLED · COUPLE_RESTORE_REQUIRED
export function joinCouple(code: string, idempotencyKey: string): Promise<ApiResponse<Couple>> {
  const trimmed = code.trim()
  if (USE_MOCK) return mockJoinCouple({ code: trimmed })

  return apiFetch<Couple>('/couples', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ code: trimmed }),
  })
}

// POST /couples/restore — 예전에 연결했던 연인과 다시 연결 (POST /couples가 409 COUPLE_RESTORE_REQUIRED일 때). 성공하면 200
// 404 COUPLE_HISTORY_NOT_FOUND, 그 밖의 오류는 POST /couples와 같다. 서버가 연결 · 복구를 다른 요청으로 보므로 멱등 키도 따로 쓴다
export function restoreCouple(code: string, idempotencyKey: string): Promise<ApiResponse<Couple>> {
  const trimmed = code.trim()
  if (USE_MOCK) return mockRestoreCouple({ code: trimmed })

  return apiFetch<Couple>('/couples/restore', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ code: trimmed }),
  })
}
