import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteCard, fetchCard } from '@/api/cards'
import { ApiError } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { Card } from '@/types/card'
import useCardDetail from './useCardDetail'

vi.mock('@/api/cards')

const CARD = { id: 'crd_01', coupleId: 'cpl_01', version: 1, title: '우리의 첫 바다 드라이브', photos: [] } as unknown as Card
const response = (card: Card): ApiResponse<Card> => ({ data: card, meta: { requestId: 'req', serverTime: '' } })
const apiError = (status: number, code: string) =>
  new ApiError(status, { error: { code, message: '', details: [], retryable: false } })

beforeEach(() => {
  vi.mocked(fetchCard).mockReset()
  vi.mocked(deleteCard).mockReset()
})

describe('useCardDetail', () => {
  it('카드를 불러온다', async () => {
    vi.mocked(fetchCard).mockResolvedValue(response(CARD))

    const { result } = renderHook(() => useCardDetail('crd_01'))
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(fetchCard).toHaveBeenCalledWith('crd_01')
    expect(result.current.card).toEqual(CARD)
  })

  it('없는 카드면 notFound, 그 밖의 실패는 error가 되고 다시 시도할 수 있다', async () => {
    vi.mocked(fetchCard).mockRejectedValueOnce(apiError(404, 'RESOURCE_NOT_FOUND'))
    const { result: missing } = renderHook(() => useCardDetail('crd_none'))
    await waitFor(() => expect(missing.current.status).toBe('notFound'))

    vi.mocked(fetchCard).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(response(CARD))
    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  it('완료하지 않은 채 작성 기간이 지난 카드(410)도 사라진 카드로 본다', async () => {
    vi.mocked(fetchCard).mockRejectedValueOnce(apiError(410, 'CARD_EDIT_WINDOW_CLOSED'))

    const { result } = renderHook(() => useCardDetail('crd_old'))

    await waitFor(() => expect(result.current.status).toBe('notFound'))
  })

  it('삭제하면 카드의 커플 id · 버전으로 지우고 deleted를 돌려준다', async () => {
    vi.mocked(fetchCard).mockResolvedValue(response(CARD))
    vi.mocked(deleteCard).mockResolvedValue()
    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })

    expect(deleteCard).toHaveBeenCalledWith(CARD)
    expect(outcome).toBe('deleted')
  })

  it('그사이 카드가 바뀌어 버전이 맞지 않으면 최신 카드를 다시 불러오고 conflict를 돌려준다', async () => {
    const updated = { ...CARD, version: 2 }
    vi.mocked(fetchCard).mockResolvedValueOnce(response(CARD)).mockResolvedValueOnce(response(updated))
    vi.mocked(deleteCard).mockRejectedValue(apiError(409, 'VERSION_CONFLICT'))
    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })

    expect(outcome).toBe('conflict')
    await waitFor(() => expect(result.current.card?.version).toBe(2))
  })

  it('이미 지워진 카드(404)는 삭제된 것으로 본다', async () => {
    vi.mocked(fetchCard).mockResolvedValue(response(CARD))
    vi.mocked(deleteCard).mockRejectedValue(apiError(404, 'RESOURCE_NOT_FOUND'))
    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })

    expect(outcome).toBe('deleted')
  })

  it('그 밖의 삭제 실패는 failed를 돌려준다', async () => {
    vi.mocked(fetchCard).mockResolvedValue(response(CARD))
    vi.mocked(deleteCard).mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let outcome
    await act(async () => {
      outcome = await result.current.remove()
    })

    expect(outcome).toBe('failed')
  })

  it('사진 링크가 만료되기 30초 전에 카드를 다시 불러와 새 링크로 바꾼다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const expiresAt = new Date(Date.now() + 2 * 60_000).toISOString()
    const withPhoto = { ...CARD, photos: [{ mediaId: 'med_1', url: 'old', urlExpiresAt: expiresAt, order: 0 }] } as Card
    const refreshed = { ...withPhoto, photos: [{ ...withPhoto.photos[0], url: 'new', urlExpiresAt: '2099-01-01T00:00:00Z' }] } as Card
    vi.mocked(fetchCard).mockResolvedValueOnce(response(withPhoto)).mockResolvedValueOnce(response(refreshed))

    const { result } = renderHook(() => useCardDetail('crd_01'))
    await waitFor(() => expect(result.current.card?.photos[0].url).toBe('old'))

    await act(() => vi.advanceTimersByTimeAsync(90_000))

    await waitFor(() => expect(result.current.card?.photos[0].url).toBe('new'))
    expect(fetchCard).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
