import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { claimStamp, getStampBook, getStampClaim } from '@/api/restAreas'
import type { Drive } from '@/types/drive'
import type { RestArea, StampBook, StampClaim } from '@/types/restArea'
import useStamps from './useStamps'

vi.mock('@/api/restAreas', () => ({
  claimStamp: vi.fn(),
  getStampBook: vi.fn(),
  getStampClaim: vi.fn(),
}))

const drive = { id: 'drv_01', coupleId: 'cpl_01' } as Drive
const restArea = { id: 'rest_01', name: '시흥하늘휴게소' } as RestArea
const book = (earnedCount: number) =>
  ({ earnedCount, catalogCount: 215, capacity: 215, items: [], nextCursor: null, hasMore: false }) as StampBook
const claim = (status: StampClaim['status']) =>
  ({ id: 'clm_01', status, reason: null, alreadyEarned: false, retryAfterSeconds: null }) as StampClaim
const meta = { requestId: 'req', serverTime: '' }

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.mocked(getStampBook).mockResolvedValue({ data: book(0), meta })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useStamps', () => {
  it('대기 중인 도장은 주기적으로 확인하고, 인정되면 도장판을 다시 불러오고 알린다', async () => {
    vi.mocked(claimStamp).mockResolvedValue({ data: claim('PENDING'), meta })
    vi.mocked(getStampClaim)
      .mockResolvedValueOnce({ data: claim('PENDING'), meta })
      .mockResolvedValueOnce({ data: claim('VERIFIED'), meta })
    const onSettled = vi.fn()
    const { result } = renderHook(() => useStamps(drive, onSettled))
    await waitFor(() => expect(result.current.book?.earnedCount).toBe(0))

    await act(() => result.current.claim(restArea, 'GPS', null))
    vi.mocked(getStampBook).mockResolvedValue({ data: book(1), meta })

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(getStampClaim).toHaveBeenCalledTimes(1)
    expect(onSettled).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(getStampClaim).toHaveBeenCalledTimes(2)
    expect(onSettled).toHaveBeenCalledWith(expect.objectContaining({ status: 'VERIFIED' }))
    await waitFor(() => expect(result.current.book?.earnedCount).toBe(1))

    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(getStampClaim).toHaveBeenCalledTimes(2)
  })

  it('거절되면 알리고 더 확인하지 않는다', async () => {
    vi.mocked(claimStamp).mockResolvedValue({ data: claim('PENDING'), meta })
    vi.mocked(getStampClaim).mockResolvedValue({ data: claim('REJECTED'), meta })
    const onSettled = vi.fn()
    const { result } = renderHook(() => useStamps(drive, onSettled))

    await act(() => result.current.claim(restArea, 'GPS', null))
    await act(() => vi.advanceTimersByTimeAsync(10_000))

    expect(onSettled).toHaveBeenCalledWith(expect.objectContaining({ status: 'REJECTED' }))
    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(getStampClaim).toHaveBeenCalledTimes(1)
  })
})
