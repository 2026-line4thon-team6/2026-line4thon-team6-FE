import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import useGoCard from './useGoCard'

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>

// 미작성 카드 목록 · 배너에서 카드 작성 화면으로 간다. 카드를 불러오기 전에도 제목을 그릴 수 있게 카드 이름을 함께 넘긴다
describe('useGoCard', () => {
  it('카드 작성 화면으로 가면서 카드 이름을 넘긴다', () => {
    const { result } = renderHook(() => ({ go: useGoCard(), location: useLocation() }), { wrapper })

    act(() => result.current.go('drv_1', '바다 드라이브'))

    expect(result.current.location.pathname).toBe('/drives/drv_1/card')
    expect(result.current.location.state).toEqual({ cardTitle: '바다 드라이브' })
  })

  it('이름을 모르면 주소만 바꾼다', () => {
    const { result } = renderHook(() => ({ go: useGoCard(), location: useLocation() }), { wrapper })

    act(() => result.current.go('drv_2'))

    expect(result.current.location.pathname).toBe('/drives/drv_2/card')
    expect(result.current.location.state).toBeNull()
  })

  it('드라이브를 마치고 갈 때는 그 사실을 함께 넘기고, 끝난 드라이브 화면을 기록에서 바꾼다', () => {
    const { result } = renderHook(() => ({ go: useGoCard(), location: useLocation() }), { wrapper })

    act(() => result.current.go('drv_3', '퇴근길', { replace: true, fromDriveEnd: true }))

    expect(result.current.location.pathname).toBe('/drives/drv_3/card')
    expect(result.current.location.state).toEqual({ cardTitle: '퇴근길', fromDriveEnd: true })
  })
})
