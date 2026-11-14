import { ApiError } from '@/api/client'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { Card, CardAuthor, CardDraftPatch, CardShare, PendingCard, Reflection, ReflectionPut } from '@/types/card'
import { createMockRecords, markMockRecordDeleted } from './records'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 드라이브 카드 목 서버.
// API 명세 D02 규칙(사진 2장 · 소감 70자 · 버전 충돌 · 완료 조건)을 같이 흉내 낸다
const HOUR = 60 * 60 * 1000
const MAX_PHOTOS = 2
const MAX_REFLECTION = 70
const MAX_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const MOCK_CARD_DRIVE_ID = 'drv_01'
// 로그인한 사용자(민준, 동승자)와 연인(민지, 운전자)
export const MOCK_ME_ID = 'usr_minjun'
const ME: CardAuthor = { id: MOCK_ME_ID, nickname: '민준', birthDate: null, profileImageUrl: null, provider: 'KAKAO' }
const PARTNER_ID = 'usr_minji'

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_card_${++requestCount}`, serverTime: new Date().toISOString() })

const fail = (status: number, code: string, message: string) =>
  new ApiError(status, { error: { code, message, details: [], retryable: false }, meta: meta() })

// Figma '카드 작성' 화면(우리의 첫 바다 드라이브)의 내용. 드라이브가 6시간 전에 끝나 18시간이 남은 상태
function createCard(now = Date.now()): Card {
  return {
    id: 'crd_writing', // 기록 지도 목 기록(crd_01 …)과 겹치지 않게 한다
    driveId: MOCK_CARD_DRIVE_ID,
    coupleId: 'cpl_01',
    status: 'UNWRITTEN',
    title: '우리의 첫 바다 드라이브',
    driveDate: '2026-11-03',
    region: '시흥 오이도',
    destination: {
      placeId: '1',
      name: '시흥 오이도',
      address: '경기 시흥시 정왕동',
      coordinate: { latitude: 37.3456, longitude: 126.6878 },
    },
    distanceMeters: 43300,
    activeDurationSeconds: 80 * 60,
    stampCount: 2,
    playlist: {
      id: 'ply_01',
      title: '노을처럼 따뜻한 우리',
      trackCount: 13,
      durationSeconds: 54 * 60,
      thumbnailUrl: '/mocks/cards/playlist-cover.webp',
    },
    photos: [],
    reflections: [],
    editableUntil: new Date(now + 18 * HOUR).toISOString(),
    completedAt: null,
    canEdit: true,
    canDelete: true,
    version: 1,
    driverUserId: PARTNER_ID,
  }
}

let card: Card = createCard()
// 업로드했지만 아직 카드에 붙이지 않은 사진 (mediaId → 미리보기 주소)
let uploads = new Map<string, string>()
let uploadCount = 0

// 테스트 · 스토리에서 처음 상태로 되돌린다
export function resetMockCards() {
  card = createCard()
  uploads = new Map()
  uploadCount = 0
}

function getCard(cardId: string) {
  if (cardId !== card.id) throw fail(404, 'NOT_FOUND', '카드를 찾을 수 없어요.')
  if (Date.now() >= Date.parse(card.editableUntil)) {
    card = { ...card, status: 'EXPIRED', canEdit: false }
    throw fail(410, 'CARD_EXPIRED', '작성 기간이 지난 카드예요.')
  }
  return card
}

function checkVersion(expected: number, actual: number) {
  if (expected !== actual) throw fail(409, 'VERSION_CONFLICT', '다른 곳에서 카드가 바뀌었어요.')
}

const copy = (value: Card): Card => structuredClone(value)

export async function mockFetchDriveCard(driveId: string): Promise<ApiResponse<Card>> {
  if (driveId !== card.driveId) throw fail(404, 'CARD_UNAVAILABLE', '이 드라이브는 카드를 만들 수 없어요.')
  return { data: copy(card), meta: meta() }
}

export async function mockFetchPendingCards(): Promise<ApiResponse<PendingCard[]>> {
  const pending = card.status === 'UNWRITTEN' || card.status === 'DRAFT'
  const remainingSeconds = Math.max(0, Math.floor((Date.parse(card.editableUntil) - Date.now()) / 1000))
  const data: PendingCard[] =
    pending && remainingSeconds > 0
      ? [
          {
            cardId: card.id,
            driveId: card.driveId,
            title: card.title,
            status: card.status as PendingCard['status'],
            editableUntil: card.editableUntil,
            remainingSeconds,
            hasDraftContent: card.photos.length > 0 || card.reflections.length > 0,
          },
        ]
      : []
  return { data, meta: meta() }
}

// POST /media/uploads + 스토리지 PUT 을 한 번에 흉내 낸다. 붙일 때 쓰는 mediaId를 돌려준다
export async function mockUploadCardPhoto(file: File): Promise<string> {
  if (!PHOTO_TYPES.includes(file.type)) throw fail(422, 'UNSUPPORTED_MEDIA_TYPE', 'JPEG · PNG · WebP 사진만 올릴 수 있어요.')
  if (file.size > MAX_BYTES) throw fail(413, 'PAYLOAD_TOO_LARGE', '사진은 10MB까지 올릴 수 있어요.')

  const mediaId = `med_mock_${++uploadCount}`
  const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : `/mocks/cards/${mediaId}`
  uploads.set(mediaId, url)
  return mediaId
}

export async function mockSaveCardDraft(cardId: string, patch: CardDraftPatch): Promise<ApiResponse<Card>> {
  const current = getCard(cardId)
  checkVersion(patch.expectedVersion, current.version)

  let next = { ...current }
  if (patch.title !== undefined) next.title = patch.title
  if (patch.photoIds) {
    if (patch.photoIds.length > MAX_PHOTOS) throw fail(422, 'VALIDATION_FAILED', '사진은 2장까지 넣을 수 있어요.')
    const attached = new Map(current.photos.map((photo) => [photo.mediaId, photo.url]))
    const expires = new Date(Date.now() + HOUR).toISOString()
    next.photos = patch.photoIds.map((mediaId, order) => {
      const url = attached.get(mediaId) ?? uploads.get(mediaId)
      if (!url) throw fail(422, 'MEDIA_NOT_READY', '사진을 찾을 수 없어요.')
      uploads.delete(mediaId)
      return { mediaId, url, urlExpiresAt: expires, order }
    })
  }
  next = { ...next, status: next.status === 'UNWRITTEN' ? 'DRAFT' : next.status, version: current.version + 1 }
  card = next
  return { data: copy(card), meta: meta() }
}

export async function mockSaveMyReflection(cardId: string, body: ReflectionPut): Promise<ApiResponse<Reflection>> {
  const current = getCard(cardId)
  const mine = current.reflections.find((reflection) => reflection.author.id === MOCK_ME_ID)
  checkVersion(body.expectedVersion, mine?.version ?? 0)

  const text = body.text
  if (text.length > MAX_REFLECTION) throw fail(422, 'VALIDATION_FAILED', '소감은 70자까지 쓸 수 있어요.')
  if (body.submitted && !text.trim()) throw fail(422, 'VALIDATION_FAILED', '소감을 입력해 주세요.')
  if (mine?.submitted && !body.submitted) throw fail(422, 'VALIDATION_FAILED', '제출한 소감은 초안으로 되돌릴 수 없어요.')

  const now = new Date().toISOString()
  const reflection: Reflection = {
    author: ME,
    text,
    submitted: body.submitted,
    submittedAt: mine?.submittedAt ?? (body.submitted ? now : null),
    updatedAt: now,
    version: (mine?.version ?? 0) + 1,
  }
  card = {
    ...current,
    status: current.status === 'UNWRITTEN' ? 'DRAFT' : current.status,
    reflections: [...current.reflections.filter((item) => item.author.id !== MOCK_ME_ID), reflection],
  }
  return { data: structuredClone(reflection), meta: meta() }
}

export async function mockCompleteCard(cardId: string, body: { expectedVersion: number }): Promise<ApiResponse<Card>> {
  const current = getCard(cardId)
  checkVersion(body.expectedVersion, current.version)

  const hasContent = current.photos.length > 0 || current.reflections.some((reflection) => reflection.submitted)
  if (!hasContent) throw fail(422, 'CARD_EMPTY', '사진이나 소감을 하나 이상 남겨 주세요.')

  card = {
    ...current,
    status: 'COMPLETED',
    completedAt: current.completedAt ?? new Date().toISOString(),
    version: current.version + 1,
  }
  return { data: copy(card), meta: meta() }
}

// ── 기록 상세 (GET /cards/{cardId} · DELETE /cards/{cardId}) ──
// 기록 목록의 완료한 기록을 카드 상세로 펼친다. 사진 · 플레이리스트 · 소감은 기록마다 조금씩 다르게 채운다

const recordAuthor = (id: string, nickname: string): CardAuthor => ({
  id,
  nickname,
  birthDate: null,
  profileImageUrl: null,
  provider: 'KAKAO',
})

// 홈 목 데이터의 나(usr_minjun) · 연인(usr_minji)과 같은 사람
const RECORD_ME = recordAuthor(MOCK_ME_ID, '민준')
const RECORD_PARTNER = recordAuthor(PARTNER_ID, '민지')

const submittedReflection = (who: CardAuthor, text: string, submittedAt: string): Reflection => ({
  author: who,
  text,
  submitted: true,
  submittedAt,
  updatedAt: submittedAt,
  version: 1,
})

const recordNotFound = () => fail(404, 'RESOURCE_NOT_FOUND', '카드를 찾을 수 없어요.')

export async function mockFetchCard(cardId: string): Promise<ApiResponse<Card>> {
  // 아직 수정 기간(24시간) 안인 작성 중 카드
  if (cardId === card.id) return { data: copy(card), meta: meta() }

  const records = createMockRecords()
  const index = records.findIndex((record) => record.cardId === cardId)
  const record = records[index]
  if (!record) throw recordNotFound()

  const submittedAt = record.completedAt ?? `${record.driveDate}T09:00:00Z`
  const photos = [record.thumbnailUrl, ...(index % 3 === 2 ? [] : [records[(index + 1) % records.length]!.thumbnailUrl])].map(
    (url, order) => ({ mediaId: `med_${cardId}_${order}`, url, urlExpiresAt: '2099-01-01T00:00:00Z', order }),
  )
  // 기록마다 소감 상태를 섞는다: 둘 다 씀 · 나만 씀(상대방 미작성) · 둘 다 씀 · 상대방만 씀(나 미작성)
  const wrote = { me: index % 4 !== 3, partner: index % 2 === 0 || index % 4 === 3 }
  const reflections = [
    ...(wrote.me ? [submittedReflection(RECORD_ME, '운전하느라 조금 힘들었지만 노을은 진짜 예뻤다 ㅎㅎ', submittedAt)] : []),
    ...(wrote.partner
      ? [submittedReflection(RECORD_PARTNER, '바다도 예쁘고 사진도 잘 나와서 만족 💗 다음에 또 가자!', submittedAt)]
      : []),
  ]

  return {
    data: {
      id: record.cardId,
      driveId: record.driveId,
      coupleId: 'cpl_mock',
      status: 'COMPLETED',
      title: record.title,
      driveDate: record.driveDate,
      region: record.destination?.address ?? '',
      destination: record.destination,
      distanceMeters: record.distanceMeters,
      activeDurationSeconds: record.activeDurationSeconds,
      stampCount: index % 4,
      playlist:
        index % 3 === 1
          ? null
          : { id: `ply_${cardId}`, title: '노을처럼 따뜻한 우리', trackCount: 13, durationSeconds: 3_600, thumbnailUrl: null },
      photos,
      reflections,
      editableUntil: `${record.driveDate}T23:59:59Z`,
      completedAt: record.completedAt,
      canEdit: false,
      canDelete: true,
      version: 1,
      driverUserId: null,
    },
    meta: meta(),
  }
}

export async function mockDeleteCard(cardId: string): Promise<void> {
  if (!createMockRecords().some((record) => record.cardId === cardId)) throw recordNotFound()
  markMockRecordDeleted(cardId)
}

export async function mockFetchCardShare(cardId: string): Promise<ApiResponse<CardShare>> {
  if (!createMockRecords().some((record) => record.cardId === cardId)) throw recordNotFound()
  return { data: { url: `https://bunbungus.app/cards/${cardId}`, access: 'COUPLE_ONLY', expiresAt: null }, meta: meta() }
}
