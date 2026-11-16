import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as homeApi from '@/api/home'
import { MOCK_CARD_DRIVE_ID, resetMockCards } from '@/mocks/cards'
import { MOCK_ME, mockDisconnectCouple, resetMockCouple } from '@/mocks/couples'
import * as location from '@/utils/location'
import useHome from './useHome'

beforeEach(() => {
  resetMockCouple()
  resetMockCards()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useHome', () => {
  it('불러오기 전에는 로그인한 사용자 닉네임만 보여 주고, 불러오면 홈 정보로 바꾼다', async () => {
    const { result } = renderHook(() => useHome(MOCK_ME))

    expect(result.current.summary).toMatchObject({ nickname: '민준', daysTogether: null, couple: null })
    expect(result.current.pendingCards).toBeNull()

    await waitFor(() => expect(result.current.summary.daysTogether).toBe(23))
    expect(result.current.summary.couple).toEqual({ id: 'cpl_01', partnerNickname: '민지' })
    expect(result.current.pendingCards?.map((card) => card.driveId)).toEqual([MOCK_CARD_DRIVE_ID])
  })

  it('현재 위치를 얻으면 위치를 담아 다시 불러와 날씨를 채운다', async () => {
    const spy = vi.spyOn(homeApi, 'fetchHome')
    renderHook(() => useHome(MOCK_ME))

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    expect(spy.mock.calls[0][0]).toBeUndefined()
    expect(spy.mock.calls[1][0]).toMatchObject({ latitude: expect.any(Number), longitude: expect.any(Number) })
  })

  it('위치 권한이 막혀 있으면 locationDenied로 알리고, 위치 없이 그대로 보여 준다', async () => {
    const spy = vi.spyOn(homeApi, 'fetchHome')
    vi.spyOn(location, 'getCurrentCoordinate').mockImplementation((onDenied) => {
      onDenied?.()
      return Promise.resolve(null)
    })
    const { result } = renderHook(() => useHome(MOCK_ME))

    await waitFor(() => expect(result.current.locationDenied).toBe(true))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('위치를 얻으면 locationDenied는 false다', async () => {
    const { result } = renderHook(() => useHome(MOCK_ME))

    await waitFor(() => expect(result.current.summary.daysTogether).toBe(23))
    expect(result.current.locationDenied).toBe(false)
  })

  it('reload하면 바뀐 상태(커플 연결 해제 등)를 다시 받아 온다', async () => {
    const { result } = renderHook(() => useHome(MOCK_ME))
    await waitFor(() => expect(result.current.summary.couple).not.toBeNull())

    await mockDisconnectCouple()
    await act(() => result.current.reload())

    expect(result.current.summary.couple).toBeNull()
    expect(result.current.pendingCards).toEqual([])
  })

  it('로그인 전에는 부르지 않는다', () => {
    const spy = vi.spyOn(homeApi, 'fetchHome')
    renderHook(() => useHome(null))

    expect(spy).not.toHaveBeenCalled()
  })

  it('불러오지 못하면 비워 둔 홈을 그대로 보여 준다', async () => {
    vi.spyOn(homeApi, 'fetchHome').mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useHome(MOCK_ME))

    await act(async () => {})
    expect(result.current.summary).toMatchObject({ nickname: '민준', couple: null })
  })
})
