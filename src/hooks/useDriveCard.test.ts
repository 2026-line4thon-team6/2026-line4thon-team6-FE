import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MOCK_CARD_DRIVE_ID,
  MOCK_ME_ID,
  mockCompleteCard,
  mockFetchDriveCard,
  mockSaveCardDraft,
  mockSaveMyReflection,
  mockUploadCardPhoto,
  resetMockCards,
} from '@/mocks/cards'
import * as cardsApi from '@/api/cards'
import { ApiError } from '@/api/client'
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

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('불러오기', () => {
  it('카드를 불러오고, 내 소감 · 연인 소감을 나눈다', async () => {
    const { result } = await renderReady()

    expect(result.current.status).toBe('ready')
    expect(result.current.card?.title).toBe('우리의 첫 바다 드라이브')
    expect(result.current.myText).toBe('')
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

// 기능명세 18: 사진 · 소감은 자동 임시저장된다 (새로고침 · 앱 종료 · 브라우저 뒤로가기에도 남는다)
describe('소감 자동 임시저장', () => {
  const savedMine = async () => {
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    return data.reflections.find((reflection) => reflection.author.id === MOCK_ME_ID) ?? null
  }

  it('입력을 멈추고 잠시 지나면 쓰던 소감을 초안으로 저장한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()

    act(() => result.current.setMyText('쓰다'))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    act(() => result.current.setMyText('쓰다 만 소감'))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(await savedMine()).toBeNull()

    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(await savedMine()).toMatchObject({ text: '쓰다 만 소감', submitted: false })
  })

  it('이어서 고치면 저장된 버전으로 다시 저장한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()

    act(() => result.current.setMyText('첫 문장'))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    act(() => result.current.setMyText('고친 문장'))
    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(await savedMine()).toMatchObject({ text: '고친 문장', version: 2 })
    expect(result.current.error).toBeNull()
  })

  it('앱이 가려지거나(탭 전환 · 앱 종료) 페이지를 떠나면 기다리지 않고 바로 저장한다', async () => {
    const { result } = await renderReady()

    act(() => result.current.setMyText('가려지기 직전'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    await waitFor(async () => expect(await savedMine()).toMatchObject({ text: '가려지기 직전' }))

    act(() => result.current.setMyText('새로고침 직전'))
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await waitFor(async () => expect(await savedMine()).toMatchObject({ text: '새로고침 직전' }))
  })

  it('화면이 사라지면(브라우저 뒤로가기) 쓰던 소감을 저장한다', async () => {
    const { result, unmount } = await renderReady()

    act(() => result.current.setMyText('뒤로가기 직전'))
    unmount()

    await waitFor(async () => expect(await savedMine()).toMatchObject({ text: '뒤로가기 직전', submitted: false }))
  })

  it('마지막으로 저장한 내용과 같으면 다시 보내지 않는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()
    const put = vi.spyOn(cardsApi, 'saveMyReflection')

    act(() => result.current.setMyText('그대로'))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    act(() => result.current.setMyText('그대로 '))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await act(() => result.current.saveDraft())

    expect(put).toHaveBeenCalledTimes(1)
  })

  it('고칠 수 없는 카드면 저장하지 않는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    vi.spyOn(cardsApi, 'fetchDriveCard').mockResolvedValue({
      data: { ...data, canEdit: false },
      meta: { requestId: 'r', serverTime: '' },
    })
    const put = vi.spyOn(cardsApi, 'saveMyReflection')
    const { result } = await renderReady()

    act(() => result.current.setMyText('못 쓰는 카드'))
    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(put).not.toHaveBeenCalled()
  })

  it('자동 저장 중에 저장하기를 눌러도 버전이 꼬이지 않고 저장된다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()

    act(() => result.current.setMyText('바로 저장'))
    await act(() => vi.advanceTimersByTimeAsync(1500))
    let saved = false
    await act(async () => {
      saved = await result.current.save()
    })

    expect(saved).toBe(true)
    expect(result.current.error).toBeNull()
    expect(await savedMine()).toMatchObject({ text: '바로 저장', submitted: true })
  })
})

// 저장을 마친 카드도 24시간 안에는 고칠 수 있다. 저장하기 없이 나가도 고친 내용을 잃지 않는다
describe('저장한 카드를 고치고 나갈 때', () => {
  const savedMine = async () => {
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    return data.reflections.find((reflection) => reflection.author.id === MOCK_ME_ID) ?? null
  }

  async function renderCompleted() {
    const hook = await renderReady()
    act(() => hook.result.current.setMyText('처음 소감'))
    await act(async () => {
      await hook.result.current.save()
    })
    expect(hook.result.current.card?.status).toBe('COMPLETED')
    return hook
  }

  it('고친 소감이 있으면 나갈 때 연인에게 보이는 소감으로 다시 제출한다', async () => {
    const { result } = await renderCompleted()
    expect(result.current.hasUnsavedChanges).toBe(false)

    act(() => result.current.setMyText('고친 소감'))
    expect(result.current.hasUnsavedChanges).toBe(true)
    await act(() => result.current.saveDraft())

    expect(await savedMine()).toMatchObject({ text: '고친 소감', submitted: true })
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('연인이 먼저 저장한 카드에 내가 쓰던 초안은 나갈 때 제출한다', async () => {
    // 연인이 사진을 붙여 저장했고, 나는 초안만 남겨 둔 상황
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    const mediaId = await mockUploadCardPhoto(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    const { data: withPhoto } = await mockSaveCardDraft(data.id, { photoIds: [mediaId], expectedVersion: data.version })
    await mockCompleteCard(data.id, { expectedVersion: withPhoto.version })
    await mockSaveMyReflection(data.id, { text: '초안', submitted: false, expectedVersion: 0 })
    const { result } = await renderReady()

    expect(result.current.hasUnsavedChanges).toBe(true)
    await act(() => result.current.saveDraft())

    expect(await savedMine()).toMatchObject({ text: '초안', submitted: true })
  })

  it('제출한 소감을 모두 지우면 빈 소감은 제출할 수 없어 그대로 둔다', async () => {
    const { result } = await renderCompleted()
    const put = vi.spyOn(cardsApi, 'saveMyReflection')

    act(() => result.current.setMyText(''))
    await act(() => result.current.saveDraft())

    expect(put).not.toHaveBeenCalled()
    expect(await savedMine()).toMatchObject({ text: '처음 소감', submitted: true })
  })
})

describe('사진 링크 만료', () => {
  it('사진 링크가 만료되기 전에 새 링크로 바꾸고, 쓰고 있던 소감은 그대로 둔다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()
    await act(() => result.current.addPhotos([jpg()]))
    act(() => result.current.setMyText('쓰는 중'))
    const refetch = vi.spyOn(cardsApi, 'fetchDriveCard')

    // 목 서버의 사진 링크는 1시간 뒤 만료된다
    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000))

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1))
    expect(result.current.card!.photos).toHaveLength(1)
    expect(result.current.myText).toBe('쓰는 중')
    vi.useRealTimers()
  })

  it('그사이 상대가 카드를 바꿔 버전이 달라도, 같은 사진의 링크는 새로 바꾼다 (버전은 그대로 둔다)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = await renderReady()
    await act(() => result.current.addPhotos([jpg()]))
    const before = result.current.card!
    const [photo] = before.photos
    vi.spyOn(cardsApi, 'fetchDriveCard').mockResolvedValueOnce({
      data: { ...before, version: before.version + 1, photos: [{ ...photo, url: 'https://cdn.test/new.jpg' }] },
      meta: { requestId: 'r', serverTime: '' },
    })

    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000))

    await waitFor(() => expect(result.current.card!.photos[0].url).toBe('https://cdn.test/new.jpg'))
    expect(result.current.card!.version).toBe(before.version)
    vi.useRealTimers()
  })
})

// 저장을 마친 카드는 24시간 동안 작성 화면에서 고치므로 여기서도 지울 수 있다 (서버는 완료한 카드만 삭제 허용)
describe('삭제', () => {
  async function renderCompleted() {
    const { data } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)
    const card = { ...data, status: 'COMPLETED' as const, canDelete: true, version: 3 }
    vi.spyOn(cardsApi, 'fetchDriveCard').mockResolvedValue({ data: card, meta: { requestId: 'r', serverTime: '' } })
    return { card, ...(await renderReady()) }
  }

  it('카드의 커플 id · 버전으로 지우고 deleted를 돌려준다. 그 뒤 화면을 나가도 초안을 저장하지 않는다', async () => {
    const remove = vi.spyOn(cardsApi, 'deleteCard').mockResolvedValue()
    const put = vi.spyOn(cardsApi, 'saveMyReflection')
    const { card, result, unmount } = await renderCompleted()

    act(() => result.current.setMyText('지우기 전에 쓰던 글'))
    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })
    unmount()

    expect(outcome).toBe('deleted')
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: card.id, coupleId: card.coupleId, version: 3 }))
    expect(put).not.toHaveBeenCalled()
  })

  it('그사이 카드가 바뀌어 버전이 맞지 않으면 최신 카드를 다시 불러오고 conflict를 돌려준다', async () => {
    vi.spyOn(cardsApi, 'deleteCard').mockRejectedValue(
      new ApiError(409, { error: { code: 'VERSION_CONFLICT', message: '' } } as never),
    )
    const { card, result } = await renderCompleted()
    vi.mocked(cardsApi.fetchDriveCard).mockResolvedValue({ data: { ...card, version: 4 }, meta: { requestId: 'r', serverTime: '' } })

    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })

    expect(outcome).toBe('conflict')
    await waitFor(() => expect(result.current.card?.version).toBe(4))
  })

  it('이미 지워진 카드(404)는 삭제된 것으로, 그 밖의 실패는 failed로 본다', async () => {
    const remove = vi
      .spyOn(cardsApi, 'deleteCard')
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new ApiError(404, { error: { code: 'RESOURCE_NOT_FOUND', message: '' } } as never))
    const { result } = await renderCompleted()

    let first, second
    await act(async () => {
      first = await result.current.remove()
    })
    await act(async () => {
      second = await result.current.remove()
    })

    expect([first, second]).toEqual(['failed', 'deleted'])
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
