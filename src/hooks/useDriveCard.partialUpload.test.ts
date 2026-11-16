import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { MOCK_CARD_DRIVE_ID, MOCK_ME_ID, resetMockCards } from '@/mocks/cards'
import useDriveCard from './useDriveCard'

const discard = vi.fn()
const upload = vi.fn()

vi.mock('@/api/cards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/cards')>()
  return {
    ...actual,
    uploadCardPhoto: (...args: unknown[]) => upload(...args),
    discardUploadedPhoto: (...args: unknown[]) => discard(...args),
  }
})

beforeEach(() => {
  resetMockCards()
  discard.mockReset().mockResolvedValue(undefined)
  upload.mockReset()
})

describe('여러 장 중 일부만 올라갔을 때', () => {
  it('먼저 올라간 사진을 지우고 카드는 그대로 둔다', async () => {
    upload
      .mockResolvedValueOnce('med_ok')
      .mockRejectedValueOnce(new ApiError(422, null))
    const { result } = renderHook(() => useDriveCard(MOCK_CARD_DRIVE_ID, MOCK_ME_ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(() =>
      result.current.addPhotos([
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      ]),
    )

    expect(result.current.card?.photos).toHaveLength(0)
    expect(discard).toHaveBeenCalledTimes(1)
    expect(discard.mock.calls[0][0]).toBe('med_ok')
  })
})
