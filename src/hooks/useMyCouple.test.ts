import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as couplesApi from '@/api/couples'
import useMyCouple from './useMyCouple'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMyCouple', () => {
  it('커플 정보(붕붕이명 · 누적 주행 거리 · 함께한 일수)를 불러온다', async () => {
    const { result } = renderHook(() => useMyCouple())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.couple).toMatchObject({
      mascotName: '붕붕이',
      cumulativeDistanceMeters: 330000,
      daysTogether: 23,
    })
  })

  it('연결된 커플이 없으면 couple은 null', async () => {
    vi.spyOn(couplesApi, 'fetchMyCouple').mockResolvedValue({
      data: { couple: null, connectionStatus: 'UNLINKED' },
      meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
    })

    const { result } = renderHook(() => useMyCouple())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.couple).toBeNull()
  })

  it('불러오지 못하면 error', async () => {
    vi.spyOn(couplesApi, 'fetchMyCouple').mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useMyCouple())

    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})
