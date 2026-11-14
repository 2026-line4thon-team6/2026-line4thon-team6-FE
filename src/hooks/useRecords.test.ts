import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRecords } from '@/api/records'
import { createMockRecords } from '@/mocks/records'
import type { ApiResponse } from '@/types/api'
import type { RecordPage, RecordSummary } from '@/types/record'
import useRecords from './useRecords'

vi.mock('@/api/records')

const [FIRST, SECOND, THIRD] = createMockRecords()

const page = (items: RecordSummary[], counts: { total: number; filtered: number }, nextCursor: string | null = null): ApiResponse<RecordPage> => ({
  data: { totalCount: counts.total, filteredCount: counts.filtered, items, nextCursor, hasMore: nextCursor !== null },
  meta: { requestId: 'req_test', serverTime: '2026-11-13T00:00:00Z' },
})

beforeEach(() => {
  vi.mocked(fetchRecords).mockReset()
})

describe('useRecords', () => {
  it('처음에는 불러오는 중이고, 응답이 오면 기록과 전체 · 조건 개수를 제공한다', async () => {
    vi.mocked(fetchRecords).mockResolvedValue(page([FIRST, SECOND], { total: 12, filtered: 12 }))

    const { result } = renderHook(() => useRecords())
    expect(result.current.status).toBe('loading')
    expect(result.current.totalCount).toBeNull()

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.records).toEqual([FIRST, SECOND])
    expect(result.current.totalCount).toBe(12)
    expect(result.current.filteredCount).toBe(12)
  })

  it('더 보기는 nextCursor로 다음 페이지를 불러와 뒤에 붙인다', async () => {
    vi.mocked(fetchRecords)
      .mockResolvedValueOnce(page([FIRST, SECOND], { total: 12, filtered: 12 }, 'cursor_2'))
      .mockResolvedValueOnce(page([THIRD], { total: 12, filtered: 12 }))

    const { result } = renderHook(() => useRecords())
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    await act(() => result.current.loadMore())

    expect(fetchRecords).toHaveBeenLastCalledWith({ cursor: 'cursor_2' })
    expect(result.current.records).toEqual([FIRST, SECOND, THIRD])
    expect(result.current.hasMore).toBe(false)
  })

  it('검색어 · 날짜가 바뀌면 첫 페이지부터 다시 불러오고, 전체 개수는 유지한다', async () => {
    vi.mocked(fetchRecords)
      .mockResolvedValueOnce(page([FIRST, SECOND], { total: 12, filtered: 12 }))
      .mockResolvedValueOnce(page([SECOND], { total: 12, filtered: 1 }))

    const { result, rerender } = renderHook((filter) => useRecords(filter), { initialProps: {} as { q?: string; date?: string } })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ q: '오이도', date: '2026-11-02' })
    // 다시 불러오는 동안에도 상단의 전체 횟수는 사라지지 않는다
    expect(result.current.totalCount).toBe(12)

    await waitFor(() => expect(result.current.records).toEqual([SECOND]))
    expect(fetchRecords).toHaveBeenLastCalledWith({ q: '오이도', date: '2026-11-02' })
    expect(result.current.filteredCount).toBe(1)
  })

  it('먼저 보낸 요청이 늦게 도착하면 버린다', async () => {
    let resolveFirst: (value: ApiResponse<RecordPage>) => void = () => {}
    vi.mocked(fetchRecords)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(page([THIRD], { total: 12, filtered: 1 }))

    const { result, rerender } = renderHook((filter) => useRecords(filter), { initialProps: {} as { q?: string } })
    rerender({ q: '광안리' })
    await waitFor(() => expect(result.current.records).toEqual([THIRD]))

    await act(async () => resolveFirst(page([FIRST, SECOND], { total: 12, filtered: 12 })))

    expect(result.current.records).toEqual([THIRD])
  })

  it('요청이 실패하면 오류 상태가 되고, 다시 시도하면 다시 불러온다', async () => {
    vi.mocked(fetchRecords)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([FIRST], { total: 12, filtered: 12 }))

    const { result } = renderHook(() => useRecords())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.records).toEqual([FIRST])
  })
})
