import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { MOCK_CARD_DRIVE_ID, MOCK_ME_ID, resetMockCards } from '@/mocks/cards'
import useDriveCard from './useDriveCard'

const discard = vi.fn()

vi.mock('@/api/cards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/cards')>()
  return {
    ...actual,
    saveCardDraft: vi.fn(() => Promise.reject(new ApiError(503, null))),
    discardUploadedPhoto: (...args: unknown[]) => discard(...args),
  }
})

beforeEach(() => {
  resetMockCards()
  discard.mockReset().mockResolvedValue(undefined)
})

describe('사진 업로드 뒤 카드에 붙이지 못했을 때', () => {
  it('올려 둔 사진을 지워서 업로드 한도를 낭비하지 않는다', async () => {
    const { result } = renderHook(() => useDriveCard(MOCK_CARD_DRIVE_ID, MOCK_ME_ID))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(() => result.current.addPhotos([new File(['x'], 'a.jpg', { type: 'image/jpeg' })]))

    expect(result.current.card?.photos).toHaveLength(0)
    expect(discard).toHaveBeenCalledTimes(1)
    expect(discard.mock.calls[0][0]).toMatch(/^med_/)
  })
})
