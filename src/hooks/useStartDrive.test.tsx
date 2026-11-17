import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import * as couplesApi from '@/api/couples'
import * as drivesApi from '@/api/drives'
import * as routesApi from '@/api/routes'
import { MOCK_ME, mockDisconnectCouple, resetMockCouple } from '@/mocks/couples'
import { resetMockDrives } from '@/mocks/drives'
import * as location from '@/utils/location'
import useStartDrive from './useStartDrive'

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>

function renderStartDrive() {
  return renderHook(() => ({ drive: useStartDrive(MOCK_ME.id), location: useLocation() }), { wrapper })
}

beforeEach(() => {
  resetMockCouple()
  resetMockDrives()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStartDrive', () => {
  it('연인과 연결돼 있지 않으면 연인 초대 화면으로 보낸다', async () => {
    await mockDisconnectCouple()
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start())

    expect(result.current.location.pathname).toBe('/couple/invite')
    expect(result.current.drive.sheetOpen).toBe(false)
  })

  it('연결 상태를 불러오지 못하면 초대 화면으로 보내지 않고 실패를 알린다', async () => {
    vi.spyOn(couplesApi, 'fetchMyCouple').mockRejectedValue(new ApiError(503, null))
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start())

    expect(result.current.location.pathname).toBe('/')
    expect(result.current.drive.toast).toBe('드라이브를 시작하지 못했어요. 다시 시도해 주세요.')
  })

  it('드라이브를 만들지 못하면 시트를 열어 둔 채 실패를 알린다', async () => {
    vi.spyOn(drivesApi, 'prepareDrive').mockRejectedValue(new ApiError(500, null))
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start())
    expect(result.current.drive.sheetOpen).toBe(true)
    await act(() => result.current.drive.submit('바다'))

    expect(result.current.drive.sheetOpen).toBe(true)
    expect(result.current.location.pathname).toBe('/')
    expect(result.current.drive.toast).toBe('드라이브를 시작하지 못했어요. 다시 시도해 주세요.')

    act(() => result.current.drive.clearToast())
    expect(result.current.drive.toast).toBeNull()
  })
})

// 장소 상세(스마트 탐색 & 큐레이션)에서 시작하면 이름만 정하고 바로 그 장소로 경로 안내를 시작한다
describe('장소로 바로 출발', () => {
  const HERE = { latitude: 37.5665, longitude: 126.978 }
  const OIDO = { placeId: 'plc_oido', name: '시흥 오이도', address: '경기 시흥시 정왕동', coordinate: { latitude: 37.3456, longitude: 126.6889 } }

  it('이름을 정하면 현재 위치에서 그 장소까지 경로를 만들어 드라이브를 출발시키고 드라이브 화면으로 간다', async () => {
    vi.spyOn(location, 'getCurrentCoordinate').mockResolvedValue(HERE)
    const route = vi.spyOn(routesApi, 'createRoute')
    const prepare = vi.spyOn(drivesApi, 'prepareDrive')
    const start = vi.spyOn(drivesApi, 'startDrive')
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start('plc_oido', OIDO))
    await act(() => result.current.drive.submit('바다 보러'))

    expect(route.mock.calls[0][0]).toMatchObject({ origin: { coordinate: HERE }, destination: OIDO })
    expect(prepare.mock.calls[0][0]).toMatchObject({ title: '바다 보러', routeId: expect.any(String) })
    expect(start.mock.calls[0][1]).toMatchObject({ initialCoordinate: HERE })
    expect(result.current.location.pathname).toBe('/drive')
    expect((await drivesApi.getActiveDrive()).data.drive).toMatchObject({ status: 'ACTIVE', destination: { name: '시흥 오이도' } })
  })

  it('현재 위치를 알 수 없으면 경로 없이 드라이브만 만들고, 목적지를 채운 경로 설정 화면으로 보낸다', async () => {
    vi.spyOn(location, 'getCurrentCoordinate').mockResolvedValue(null)
    const start = vi.spyOn(drivesApi, 'startDrive')
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start('plc_oido', OIDO))
    await act(() => result.current.drive.submit('바다 보러'))

    expect(start).not.toHaveBeenCalled()
    expect(result.current.location.pathname).toBe('/drive/route')
    expect(result.current.location.state).toEqual({ destinationPlaceId: 'plc_oido' })
    expect((await drivesApi.getActiveDrive()).data.drive?.status).toBe('PREPARING')
  })

  it('출발하지 못하면 경로 설정 화면에서 직접 출발하게 한다', async () => {
    vi.spyOn(location, 'getCurrentCoordinate').mockResolvedValue(HERE)
    vi.spyOn(drivesApi, 'startDrive').mockRejectedValue(new ApiError(500, null))
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start('plc_oido', OIDO))
    await act(() => result.current.drive.submit('바다 보러'))

    expect(result.current.location.pathname).toBe('/drive/route')
    expect(result.current.location.state).toEqual({ destinationPlaceId: 'plc_oido' })
  })

  it('홈에서 목적지 없이 시작하면 지금처럼 드라이브 화면으로 간다', async () => {
    const route = vi.spyOn(routesApi, 'createRoute')
    const { result } = renderStartDrive()

    await act(() => result.current.drive.start())
    await act(() => result.current.drive.submit('그냥 드라이브'))

    expect(route).not.toHaveBeenCalled()
    expect(result.current.location.pathname).toBe('/drive')
  })
})
