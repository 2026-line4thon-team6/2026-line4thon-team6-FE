import { ApiError } from '@/api/client'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { Card, CardReflection } from '@/types/card'
import { createMockRecords, markMockRecordDeleted } from './records'

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_card_${++requestCount}`, serverTime: new Date().toISOString() })

const notFound = () =>
  new ApiError(404, {
    error: { code: 'RESOURCE_NOT_FOUND', message: '카드를 찾을 수 없어요.', details: [], retryable: false },
  })

const author = (id: string, nickname: string) => ({ id, nickname, birthDate: null, profileImageUrl: null, provider: 'KAKAO' as const })

const reflection = (who: ReturnType<typeof author>, text: string, submittedAt: string): CardReflection => ({
  author: who,
  text,
  submitted: true,
  submittedAt,
  updatedAt: submittedAt,
  version: 1,
})

const ME = author('usr_mock_me', '동민')
const PARTNER = author('usr_mock_partner', '서연')

// 기록 목록의 기록을 카드 상세로 펼친다. 사진 · 플레이리스트 · 소감은 기록마다 조금씩 다르게 채운다
export async function mockFetchCard(cardId: string): Promise<ApiResponse<Card>> {
  const records = createMockRecords()
  const index = records.findIndex((record) => record.cardId === cardId)
  const record = records[index]
  if (!record) throw notFound()

  const submittedAt = record.completedAt ?? `${record.driveDate}T09:00:00Z`
  const photos = [record.thumbnailUrl, ...(index % 3 === 2 ? [] : [records[(index + 1) % records.length]!.thumbnailUrl])].map(
    (url, order) => ({ mediaId: `med_${cardId}_${order}`, url, urlExpiresAt: '2099-01-01T00:00:00Z', order }),
  )
  const reflections = [
    reflection(ME, '운전하느라 조금 힘들었지만 노을은 진짜 예뻤다 ㅎㅎ', submittedAt),
    ...(index % 2 === 0 ? [reflection(PARTNER, '바다도 예쁘고 사진도 잘 나와서 만족 💗 다음에 또 가자!', submittedAt)] : []),
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
    },
    meta: meta(),
  }
}

export async function mockDeleteCard(cardId: string): Promise<void> {
  if (!createMockRecords().some((record) => record.cardId === cardId)) throw notFound()
  markMockRecordDeleted(cardId)
}
