import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import {
  MOCK_CARD_DRIVE_ID,
  MOCK_ME_ID,
  mockCompleteCard,
  mockFetchDriveCard,
  mockFetchPendingCards,
  mockSaveCardDraft,
  mockSaveMyReflection,
  mockUploadCardPhoto,
  resetMockCards,
} from './cards'

// API 명세 D02(카드 보존·완료 조건) 기준으로 목 서버가 같은 규칙을 지키는지 확인한다
async function loadCard() {
  return (await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)).data
}

beforeEach(() => {
  resetMockCards()
})

describe('GET /drives/{driveId}/card', () => {
  it('처음에는 사진 · 소감이 없는 미작성 카드를 돌려준다', async () => {
    const card = await loadCard()

    expect(card.status).toBe('UNWRITTEN')
    expect(card.photos).toEqual([])
    expect(card.reflections).toEqual([])
    expect(card.driverUserId).not.toBe(MOCK_ME_ID)
  })

  it('없는 드라이브는 404 CARD_UNAVAILABLE', async () => {
    await expect(mockFetchDriveCard('drv_none')).rejects.toMatchObject({ status: 404, code: 'CARD_UNAVAILABLE' })
  })
})

describe('사진', () => {
  it('업로드한 사진을 PATCH로 붙이면 순서대로 들어가고 버전이 오른다', async () => {
    const card = await loadCard()
    const first = await mockUploadCardPhoto(new File(['a'], 'a.jpg', { type: 'image/jpeg' }))
    const second = await mockUploadCardPhoto(new File(['b'], 'b.png', { type: 'image/png' }))

    const { data } = await mockSaveCardDraft(card.id, {
      photoIds: [first, second],
      expectedVersion: card.version,
    })

    expect(data.photos.map((photo) => [photo.mediaId, photo.order])).toEqual([
      [first, 0],
      [second, 1],
    ])
    expect(data.status).toBe('DRAFT')
    expect(data.version).toBe(card.version + 1)
  })

  it('3장 이상은 422로 거절한다', async () => {
    const card = await loadCard()
    const ids = await Promise.all(
      ['a', 'b', 'c'].map((name) => mockUploadCardPhoto(new File([name], `${name}.jpg`, { type: 'image/jpeg' }))),
    )

    await expect(mockSaveCardDraft(card.id, { photoIds: ids, expectedVersion: card.version })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('버전이 다르면 409 VERSION_CONFLICT', async () => {
    const card = await loadCard()

    await expect(
      mockSaveCardDraft(card.id, { photoIds: [], expectedVersion: card.version + 5 }),
    ).rejects.toMatchObject({ status: 409, code: 'VERSION_CONFLICT' })
  })

  it('10MiB를 넘거나 JPEG · PNG · WebP가 아닌 파일은 업로드하지 않는다', async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })
    const gif = new File(['g'], 'a.gif', { type: 'image/gif' })

    await expect(mockUploadCardPhoto(big)).rejects.toBeInstanceOf(ApiError)
    await expect(mockUploadCardPhoto(gif)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('내 소감', () => {
  it('처음 저장은 expectedVersion 0, 이후 버전이 오른다', async () => {
    const card = await loadCard()

    const first = await mockSaveMyReflection(card.id, { text: '초안', submitted: false, expectedVersion: 0 })
    const second = await mockSaveMyReflection(card.id, { text: '제출', submitted: true, expectedVersion: first.data.version })

    expect(first.data.version).toBe(1)
    expect(second.data).toMatchObject({ text: '제출', submitted: true, version: 2 })
    expect(second.data.author.id).toBe(MOCK_ME_ID)
    expect((await loadCard()).reflections).toHaveLength(1)
  })

  it('70자를 넘거나, 제출한 소감을 초안으로 되돌리면 거절한다', async () => {
    const card = await loadCard()

    await expect(
      mockSaveMyReflection(card.id, { text: '가'.repeat(71), submitted: true, expectedVersion: 0 }),
    ).rejects.toMatchObject({ status: 422 })

    const { data } = await mockSaveMyReflection(card.id, { text: '좋았다', submitted: true, expectedVersion: 0 })
    await expect(
      mockSaveMyReflection(card.id, { text: '좋았다', submitted: false, expectedVersion: data.version }),
    ).rejects.toMatchObject({ status: 422 })
  })
})

describe('POST /cards/{cardId}/complete', () => {
  it('사진도 제출한 소감도 없으면 422로 거절한다', async () => {
    const card = await loadCard()

    await expect(mockCompleteCard(card.id, { expectedVersion: card.version })).rejects.toMatchObject({ status: 422 })
  })

  it('제출한 소감이 하나라도 있으면 완료되고, 미작성 목록에서 빠진다', async () => {
    const card = await loadCard()
    await mockSaveMyReflection(card.id, { text: '노을이 예뻤다', submitted: true, expectedVersion: 0 })

    const { data } = await mockCompleteCard(card.id, { expectedVersion: card.version })

    expect(data.status).toBe('COMPLETED')
    expect(data.completedAt).not.toBeNull()
    expect((await mockFetchPendingCards()).data).toEqual([])
  })
})

describe('GET /cards/pending', () => {
  it('저장 전 카드의 남은 시간을 돌려준다 (24시간 이하)', async () => {
    const { data } = await mockFetchPendingCards()

    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ driveId: MOCK_CARD_DRIVE_ID, status: 'UNWRITTEN' })
    expect(data[0].remainingSeconds).toBeGreaterThan(0)
    expect(data[0].remainingSeconds).toBeLessThanOrEqual(24 * 3600)
  })
})
