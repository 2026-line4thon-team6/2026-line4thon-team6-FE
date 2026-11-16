import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import * as couplesApi from '@/api/couples'
import * as drivesApi from '@/api/drives'
import { MOCK_ME, mockDisconnectCouple, resetMockCouple } from '@/mocks/couples'
import { resetMockDrives } from '@/mocks/drives'
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
