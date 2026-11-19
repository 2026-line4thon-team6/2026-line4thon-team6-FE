import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useAppUpdate from './useAppUpdate'

// 새 배포 확인: /version.json 의 buildId 가 지금 실행 중인 빌드와 다르면 업데이트를 안내한다
function mockVersion(buildId: string | null) {
  const fetchMock = vi.fn().mockImplementation(() =>
    buildId === null
      ? Promise.reject(new Error('offline'))
      : Promise.resolve(new Response(JSON.stringify({ buildId }), { status: 200 })),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useAppUpdate', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('시작할 때 확인해서 새 빌드가 있으면 알려 준다', async () => {
    const fetchMock = mockVersion('build-2')
    const { result } = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))

    await waitFor(() => expect(result.current.available).toBe(true))
    expect(fetchMock).toHaveBeenCalledWith('/version.json', expect.objectContaining({ cache: 'no-store' }))
  })

  it('같은 빌드면 알리지 않는다', async () => {
    const fetchMock = mockVersion('build-1')
    const { result } = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current.available).toBe(false)
  })

  it('확인에 실패하면 조용히 넘어간다', async () => {
    const fetchMock = mockVersion(null)
    const { result } = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current.available).toBe(false)
  })

  it('꺼 두면 확인하지 않는다 (개발 서버)', () => {
    const fetchMock = mockVersion('build-2')
    renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: false }))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('화면으로 돌아오면 다시 확인한다', async () => {
    const fetchMock = mockVersion('build-1')
    const { result } = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    mockVersion('build-2')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => expect(result.current.available).toBe(true))
  })

  it('닫으면 이번 세션 동안은 같은 빌드를 다시 알리지 않는다', async () => {
    mockVersion('build-2')
    const { result, unmount } = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))
    await waitFor(() => expect(result.current.available).toBe(true))

    act(() => result.current.dismiss())
    expect(result.current.available).toBe(false)
    unmount()

    const fetchMock = mockVersion('build-2')
    const again = renderHook(() => useAppUpdate({ currentBuildId: 'build-1', enabled: true }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(again.result.current.available).toBe(false)
  })
})
