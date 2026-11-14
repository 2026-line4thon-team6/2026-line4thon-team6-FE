import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRecordMap } from '@/api/records'
import { createMockRecordMarkers } from '@/mocks/records'
import type { ApiResponse } from '@/types/api'
import type { RecordMap, RecordMapMarker } from '@/types/record'
import useRecordMap from './useRecordMap'

vi.mock('@/api/records')

const [FIRST, SECOND, THIRD] = createMockRecordMarkers()

const page = (markers: RecordMapMarker[], totalCount: number, nextCursor: string | null = null): ApiResponse<RecordMap> => ({
  data: { totalCount, markers, nextCursor, hasMore: nextCursor !== null },
  meta: { requestId: 'req_test', serverTime: '2026-11-13T00:00:00Z' },
})

beforeEach(() => {
  vi.mocked(fetchRecordMap).mockReset()
})

describe('useRecordMap', () => {
  it('처음에는 불러오는 중이고, 응답이 오면 마커와 전체 기록 수를 제공한다', async () => {
    vi.mocked(fetchRecordMap).mockResolvedValue(page([FIRST, SECOND], 12))

    const { result } = renderHook(() => useRecordMap())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.markers).toEqual([FIRST, SECOND])
    expect(result.current.totalCount).toBe(12)
  })

  it('다음 페이지가 있으면 끝까지 받아 마커를 모두 합친다', async () => {
    vi.mocked(fetchRecordMap)
      .mockResolvedValueOnce(page([FIRST, SECOND], 12, 'cursor_2'))
      .mockResolvedValueOnce(page([THIRD], 12))

    const { result } = renderHook(() => useRecordMap())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(fetchRecordMap).toHaveBeenNthCalledWith(1, { limit: 100 })
    expect(fetchRecordMap).toHaveBeenNthCalledWith(2, { limit: 100, cursor: 'cursor_2' })
    expect(result.current.markers).toEqual([FIRST, SECOND, THIRD])
  })

  it('중간 페이지가 실패해도 오류 상태가 되고, 다시 시도하면 처음부터 다시 받는다', async () => {
    vi.mocked(fetchRecordMap)
      .mockResolvedValueOnce(page([FIRST], 12, 'cursor_2'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([FIRST, SECOND], 12))

    const { result } = renderHook(() => useRecordMap())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.markers).toEqual([])

    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.markers).toEqual([FIRST, SECOND])
  })

  it('검색어 · 날짜가 바뀌면 그 조건으로 다시 불러온다', async () => {
    vi.mocked(fetchRecordMap).mockResolvedValueOnce(page([FIRST, SECOND], 12)).mockResolvedValueOnce(page([SECOND], 1))

    const { result, rerender } = renderHook((filter) => useRecordMap(filter), { initialProps: {} as { q?: string; date?: string } })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ q: '오이도', date: '2026-11-02' })

    await waitFor(() => expect(result.current.markers).toEqual([SECOND]))
    expect(fetchRecordMap).toHaveBeenLastCalledWith({ limit: 100, q: '오이도', date: '2026-11-02' })
  })

  it('먼저 보낸 요청이 늦게 도착하면 버린다', async () => {
    let resolveFirst: (value: ApiResponse<RecordMap>) => void = () => {}
    vi.mocked(fetchRecordMap)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(page([THIRD], 1))

    const { result, rerender } = renderHook((filter) => useRecordMap(filter), { initialProps: {} as { q?: string } })
    rerender({ q: '광안리' })
    await waitFor(() => expect(result.current.markers).toEqual([THIRD]))

    await act(async () => resolveFirst(page([FIRST, SECOND], 12)))

    expect(result.current.markers).toEqual([THIRD])
  })
})
