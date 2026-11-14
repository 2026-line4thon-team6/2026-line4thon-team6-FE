import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_CARD_DRIVE_ID, MOCK_ME_ID, mockFetchDriveCard, mockSaveCardDraft, resetMockCards } from '@/mocks/cards'
import useDriveCard from './useDriveCard'

const jpg = (name = 'a.jpg') => new File(['x'], name, { type: 'image/jpeg' })

async function renderReady(driveId = MOCK_CARD_DRIVE_ID) {
  const hook = renderHook(() => useDriveCard(driveId, MOCK_ME_ID))
  await waitFor(() => expect(hook.result.current.status).not.toBe('loading'))
  return hook
}

beforeEach(() => {
  resetMockCards()
})

describe('불러오기', () => {
  it('카드를 불러오고, 내 소감 · 연인 소감 · 내 역할을 나눈다', async () => {
    const { result } = await renderReady()

    expect(result.current.status).toBe('ready')
    expect(result.current.card?.title).toBe('우리의 첫 바다 드라이브')
    expect(result.current.myText).toBe('')
    expect(result.current.myRole).toBe('PASSENGER')
    expect(result.current.partnerText).toBeNull()
  })

  it('카드를 만들 수 없는 드라이브면 unavailable', async () => {
    const { result } = await renderReady('drv_none')

    expect(result.current.status).toBe('unavailable')
  })
})

describe('사진', () => {
  it('고른 사진을 올려 카드에 붙인다', async () => {
    const { result } = await renderReady()

    await act(() => result.current.addPhotos([jpg('a.jpg'), jpg('b.jpg')]))

    expect(result.current.card?.photos).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('2장을 넘게 고르면 앞의 사진만 올리고 안내한다', async () => {
    const { result } = await renderReady()

    await act(() => result.current.addPhotos([jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg')]))

    expect(result.current.card?.photos).toHaveLength(2)
    expect(result.current.error).toBe('사진은 2장까지 넣을 수 있어요.')
  })

  it('1장이 있을 때 2장을 고르면 남은 1칸만 채우고 안내한다', async () => {
    const { result } = await renderReady()
    await act(() => result.current.addPhotos([jpg('a.jpg')]))

    await act(() => result.current.addPhotos([jpg('b.jpg'), jpg('c.jpg')]))

    expect(result.current.card?.photos).toHaveLength(2)
    expect(result.current.error).toBe('사진은 2장까지 넣을 수 있어요.')
  })

  it('지원하지 않는 형식이나 10MB를 넘는 사진은 올리지 않고 안내한다', async () => {
    const { result } = await renderReady()
    const gif = new File(['g'], 'a.gif', { type: 'image/gif' })
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })

    await act(() => result.current.addPhotos([gif]))
    expect(result.current.error).toBe('JPEG · PNG · WebP 사진만 올릴 수 있어요.')

    await act(() => result.current.addPhotos([big]))
    expect(result.current.error).toBe('사진은 10MB까지 올릴 수 있어요.')
    expect(result.current.card?.photos).toHaveLength(0)
  })

  it('사진을 지우고, 두 장의 순서를 바꾼다', async () => {
    const { result } = await renderReady()
    await act(() => result.current.addPhotos([jpg('a.jpg'), jpg('b.jpg')]))
    const [first, second] = result.current.card!.photos.map((photo) => photo.mediaId)

    await act(() => result.current.swapPhotos())
    expect(result.current.card?.photos.map((photo) => photo.mediaId)).toEqual([second, first])

    await act(() => result.current.removePhoto(second))
    expect(result.current.card?.photos.map((photo) => photo.mediaId)).toEqual([first])
  })

  it('다른 곳에서 카드가 바뀌어 버전이 다르면 다시 불러오고 안내한다', async () => {
    const { result } = await renderReady()
    // 연인이 먼저 제목을 바꿔 버전이 올라간 상황
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    await mockSaveCardDraft(data.id, { title: '바뀐 제목', expectedVersion: data.version })

    await act(() => result.current.addPhotos([jpg()]))

    expect(result.current.error).toBe('연인이 카드를 수정해서 새로 불러왔어요. 다시 시도해 주세요.')
    expect(result.current.card?.title).toBe('바뀐 제목')
  })
})

describe('저장', () => {
  it('사진도 소감도 없으면 저장할 수 없다', async () => {
    const { result } = await renderReady()

    expect(result.current.canSave).toBe(false)
  })

  it('내 소감을 쓰면 저장할 수 있고, 저장하면 소감을 제출한 뒤 카드를 완료한다', async () => {
    const { result } = await renderReady()

    act(() => result.current.setMyText('노을이 진짜 예뻤다'))
    expect(result.current.canSave).toBe(true)

    let saved = false
    await act(async () => {
      saved = await result.current.save()
    })

    expect(saved).toBe(true)
    expect(result.current.card?.status).toBe('COMPLETED')
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    expect(data.reflections[0]).toMatchObject({ text: '노을이 진짜 예뻤다', submitted: true })
  })

  it('소감은 70자까지만 입력된다', async () => {
    const { result } = await renderReady()

    act(() => result.current.setMyText('가'.repeat(80)))

    expect(result.current.myText).toHaveLength(70)
  })

  it('나갈 때는 쓰던 소감을 초안으로 저장해 둔다', async () => {
    const { result } = await renderReady()
    act(() => result.current.setMyText('쓰다 만 소감'))

    await act(() => result.current.saveDraft())

    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    expect(data.status).toBe('DRAFT')
    expect(data.reflections[0]).toMatchObject({ text: '쓰다 만 소감', submitted: false })
  })
})
