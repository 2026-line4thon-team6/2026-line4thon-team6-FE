import {
  mockCompleteCard,
  mockDeleteCard,
  mockFetchCard,
  mockFetchDriveCard,
  mockFetchPendingCards,
  mockSaveCardDraft,
  mockSaveMyReflection,
  mockUploadCardPhoto,
} from '@/mocks/cards'
import type { ApiResponse } from '@/types/api'
import type { Card, CardDraftPatch, PendingCard, Reflection, ReflectionPut } from '@/types/card'
import { apiFetch, ApiError, USE_MOCK } from './client'

export interface CoupleRequestOptions {
  // 현재 연결된 커플 id. 오래된 화면의 쓰기 요청을 서버가 걸러낸다
  coupleId: string
}

export interface IdempotentRequestOptions extends CoupleRequestOptions {
  // 같은 요청의 재시도에는 같은 키를 쓴다
  idempotencyKey: string
}

const cardPath = (cardId: string) => `/cards/${encodeURIComponent(cardId)}`

// GET /cards/{cardId} — 카드 상세와 두 사람의 소감
export function fetchCard(cardId: string): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockFetchCard(cardId)

  return apiFetch<Card>(cardPath(cardId))
}

// DELETE /cards/{cardId} — 공동 기록 삭제 (복구 불가). 양쪽 기록 · 지도 · 공유 링크에서 바로 빠진다.
// 오래된 화면의 요청을 막기 위해 커플 id와 카드 버전을 함께 보낸다. 버전이 다르면 409
export async function deleteCard(card: Pick<Card, 'id' | 'coupleId' | 'version'>): Promise<void> {
  if (USE_MOCK) return mockDeleteCard(card.id)

  await apiFetch(cardPath(card.id), {
    method: 'DELETE',
    headers: { 'X-Couple-Id': card.coupleId, 'X-Expected-Version': String(card.version) },
  })
}

// GET /drives/{driveId}/card — 종료한 드라이브의 카드 작성 데이터. 카드를 만들 수 없는 드라이브는 404 CARD_UNAVAILABLE
export function fetchDriveCard(driveId: string): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockFetchDriveCard(driveId)

  return apiFetch<Card>(`/drives/${encodeURIComponent(driveId)}/card`)
}

// GET /cards/pending — 24시간 안에 저장하지 않은 카드 (마감이 빠른 순)
export function fetchPendingCards(): Promise<ApiResponse<PendingCard[]>> {
  if (USE_MOCK) return mockFetchPendingCards()

  return apiFetch<PendingCard[]>('/cards/pending')
}

// PATCH /cards/{cardId}/draft — 제목 · 사진 순서 임시저장. photoIds는 전체 순서이고 첫 사진이 대표다
export function saveCardDraft(
  cardId: string,
  patch: CardDraftPatch,
  { coupleId }: CoupleRequestOptions,
): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockSaveCardDraft(cardId, patch)

  return apiFetch<Card>(`${cardPath(cardId)}/draft`, {
    method: 'PATCH',
    headers: { 'X-Couple-Id': coupleId },
    body: JSON.stringify(patch),
  })
}

// PUT /cards/{cardId}/reflections/me — submitted=false는 나만 보이는 초안, true는 연인에게 공개 (첫 제출만 알림)
export function saveMyReflection(
  cardId: string,
  body: ReflectionPut,
  { coupleId }: CoupleRequestOptions,
): Promise<ApiResponse<Reflection>> {
  if (USE_MOCK) return mockSaveMyReflection(cardId, body)

  return apiFetch<Reflection>(`${cardPath(cardId)}/reflections/me`, {
    method: 'PUT',
    headers: { 'X-Couple-Id': coupleId },
    body: JSON.stringify(body),
  })
}

// POST /cards/{cardId}/complete — 사진 1장 또는 제출한 소감 1개 이상이면 저장(기록에 노출)된다
export function completeCard(
  cardId: string,
  expectedVersion: number,
  { coupleId, idempotencyKey }: IdempotentRequestOptions,
): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockCompleteCard(cardId, { expectedVersion })

  return apiFetch<Card>(`${cardPath(cardId)}/complete`, {
    method: 'POST',
    headers: { 'X-Couple-Id': coupleId, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ expectedVersion }),
  })
}

interface MediaUpload {
  mediaId: string
  uploadUrl: string
  method: 'PUT'
  requiredHeaders: Record<string, string>
  expiresAt: string
  maxBytes: number
}

// 사진 한 장 업로드: POST /media/uploads 로 업로드 주소를 받고 스토리지에 바로 PUT 한다.
// 스토리지에는 requiredHeaders만 보내고 서비스 Authorization은 붙이지 않는다. 카드에 붙일 mediaId를 돌려준다
export async function uploadCardPhoto(file: File, { coupleId, idempotencyKey }: IdempotentRequestOptions): Promise<string> {
  if (USE_MOCK) return mockUploadCardPhoto(file)

  const { data } = await apiFetch<MediaUpload>('/media/uploads', {
    method: 'POST',
    headers: { 'X-Couple-Id': coupleId, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, bytes: file.size, purpose: 'CARD_PHOTO' }),
  })

  const response = await fetch(data.uploadUrl, { method: data.method, headers: data.requiredHeaders, body: file })
  if (!response.ok) throw new ApiError(response.status, null)
  return data.mediaId
}
