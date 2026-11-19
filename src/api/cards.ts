import {
  mockCompleteCard,
  mockDeleteCard,
  mockDiscardCard,
  mockFetchCard,
  mockFetchCardShare,
  mockFetchDriveCard,
  mockSaveCardDraft,
  mockSaveMyReflection,
  mockDiscardUploadedPhoto,
  mockUploadCardPhoto,
  MOCK_ME_ID,
} from '@/mocks/cards'
import { findMockDrive } from '@/mocks/drives'
import type { ApiResponse } from '@/types/api'
import type { Card, CardDraftPatch, CardShare, Reflection, ReflectionPut } from '@/types/card'
import { apiFetch, ApiError, DEMO, isDemoId, USE_MOCK } from './client'

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

// POST /cards/{cardId}/discard — 둘 다 아무것도 쓰지 않은(UNWRITTEN) 카드를 기한 안에 폐기한다.
// 누군가 쓰기 시작했으면 409 CARD_DRAFT_STARTED, 저장한 카드는 422 CARD_ALREADY_COMPLETED(기록 삭제로 지운다)
export async function discardCard(card: Pick<Card, 'id' | 'coupleId' | 'version'>, idempotencyKey: string): Promise<void> {
  if (USE_MOCK || isDemoId(card.id)) return mockDiscardCard(card.id, { expectedVersion: card.version })

  await apiFetch(`${cardPath(card.id)}/discard`, {
    method: 'POST',
    headers: { 'X-Couple-Id': card.coupleId, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ expectedVersion: card.version }),
  })
}

// GET /cards/{cardId}/share — 완료 카드의 커플 전용 공유 링크
export function fetchCardShare(cardId: string): Promise<ApiResponse<CardShare>> {
  if (USE_MOCK) return mockFetchCardShare(cardId)

  return apiFetch<CardShare>(`${cardPath(cardId)}/share`)
}

// 시연 카드(목)의 내 소감 작성자를 시연 드라이브를 시작한 실제 사용자로 바꿔 돌려준다 (화면은 실제 사용자 id로 내 소감을 찾는다)
let demoCardOpen = false

function asMine(reflection: Reflection, cardId: string): Reflection {
  const me = findMockDrive(cardId.replace(/^crd_/, ''))?.recorderUserId
  return me && reflection.author.id === MOCK_ME_ID ? { ...reflection, author: { ...reflection.author, id: me } } : reflection
}

const demoCard = async (request: Promise<ApiResponse<Card>>) => {
  const response = await request
  const card = response.data
  return { ...response, data: { ...card, reflections: card.reflections.map((item) => asMine(item, card.id)) } }
}

// GET /drives/{driveId}/card — 종료한 드라이브의 카드 작성 데이터. 카드를 만들 수 없는 드라이브는 404 CARD_UNAVAILABLE
export function fetchDriveCard(driveId: string): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockFetchDriveCard(driveId)
  demoCardOpen = isDemoId(driveId)
  if (demoCardOpen) return demoCard(mockFetchDriveCard(driveId))

  return apiFetch<Card>(`/drives/${encodeURIComponent(driveId)}/card`)
}

// 미작성 카드 목록을 열 때 미리 받아 둔 카드. 작성 화면이 불러오는 중 화면 없이 바로 내용과 함께 열리게 한다.
// 사진 링크(10분 서명 URL)가 낡지 않도록 짧게만 쓰고, 화면은 열리자마자 최신 카드를 다시 받는다
const PREFETCH_MAX_AGE_MS = 60_000
const prefetched = new Map<string, { card: Card; at: number }>()

export async function prefetchDriveCard(driveId: string): Promise<void> {
  try {
    const { data } = await fetchDriveCard(driveId)
    prefetched.set(driveId, { card: data, at: Date.now() })
  } catch {
    prefetched.delete(driveId)
  }
}

export function peekDriveCard(driveId: string): Card | null {
  const entry = prefetched.get(driveId)
  if (!entry || Date.now() - entry.at > PREFETCH_MAX_AGE_MS) return null
  return structuredClone(entry.card)
}

export function clearDriveCardCache() {
  prefetched.clear()
}

// PATCH /cards/{cardId}/draft — 제목 · 사진 순서 임시저장. photoIds는 전체 순서이고 첫 사진이 대표다
export function saveCardDraft(
  cardId: string,
  patch: CardDraftPatch,
  { coupleId }: CoupleRequestOptions,
): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockSaveCardDraft(cardId, patch)
  if (isDemoId(cardId)) return demoCard(mockSaveCardDraft(cardId, patch))

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
  if (isDemoId(cardId)) return mockSaveMyReflection(cardId, body).then((response) => ({ ...response, data: asMine(response.data, cardId) }))

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
  if (isDemoId(cardId)) return demoCard(mockCompleteCard(cardId, { expectedVersion }))

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

function readBytes(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

// 서버가 받은 바이트와 같은지 확인하는 해시. crypto.subtle은 https · localhost에서만 쓸 수 있다
// 서버는 파일 이름을 200자까지 받는다. 넘으면 확장자를 살려 앞부분을 줄인다
const MAX_FILE_NAME = 200

function shortenFileName(name: string): string {
  if (name.length <= MAX_FILE_NAME) return name
  const dot = name.lastIndexOf('.')
  const extension = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : ''
  return name.slice(0, MAX_FILE_NAME - extension.length) + extension
}

async function sha256Hex(file: Blob): Promise<string> {
  // 복사해서 넘긴다. 테스트(jsdom)의 FileReader 결과는 다른 realm의 ArrayBuffer라 그대로는 digest가 받지 않는다
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(new Uint8Array(await readBytes(file))))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// 사진 한 장 업로드: POST /media/uploads 로 업로드 주소를 받고 → 그 주소(백엔드의 /media/{id}/content)에 파일을 PUT 하고
// → POST /media/{id}/complete 로 파일 해시를 보내 READY 상태로 만든다. READY가 아니면 카드에 붙일 때 MEDIA_NOT_READY로 거절된다.
// 업로드 주소는 쿼리의 토큰으로 인증하므로 requiredHeaders만 보내고 Authorization은 붙이지 않는다. 카드에 붙일 mediaId를 돌려준다
export async function uploadCardPhoto(file: File, { coupleId, idempotencyKey }: IdempotentRequestOptions): Promise<string> {
  if (USE_MOCK || (DEMO && demoCardOpen)) return mockUploadCardPhoto(file)

  const { data } = await apiFetch<MediaUpload>('/media/uploads', {
    method: 'POST',
    headers: { 'X-Couple-Id': coupleId, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ fileName: shortenFileName(file.name), contentType: file.type, bytes: file.size, purpose: 'CARD_PHOTO' }),
  })

  const response = await fetch(data.uploadUrl, { method: data.method, headers: data.requiredHeaders, body: file })
  if (!response.ok) throw new ApiError(response.status, await response.json().catch(() => null))

  // 완료 요청은 업로드 요청과 다른 동작이라 키를 따로 쓴다. 같은 업로드를 재시도하면 같은 키가 나온다
  await apiFetch(`/media/${encodeURIComponent(data.mediaId)}/complete`, {
    method: 'POST',
    headers: { 'X-Couple-Id': coupleId, 'Idempotency-Key': `${idempotencyKey}-complete` },
    body: JSON.stringify({ sha256: await sha256Hex(file) }),
  })
  return data.mediaId
}

// DELETE /media/{mediaId} — 올렸지만 카드에 붙이지 못한 사진을 지운다. 카드에 붙은 사진은 409(MEDIA_IN_USE)라 draft PATCH로 뺀다
export async function discardUploadedPhoto(mediaId: string, { coupleId }: CoupleRequestOptions): Promise<void> {
  if (USE_MOCK || isDemoId(mediaId)) return mockDiscardUploadedPhoto(mediaId)

  await apiFetch(`/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE', headers: { 'X-Couple-Id': coupleId } })
}
