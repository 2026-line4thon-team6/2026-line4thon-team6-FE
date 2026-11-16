import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ApiResponse, CursorPage } from '@/types/api'
import useCursorList from './useCursorList'

const page = (items: string[], nextCursor: string | null = null): ApiResponse<CursorPage<string>> => ({
  data: { items, nextCursor, hasMore: nextCursor !== null },
  meta: { requestId: 'req_test', serverTime: '2026-11-16T00:00:00Z' },
})

// 응답 순서를 테스트에서 정할 수 있게 직접 끝내는 Promise
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('useCursorList', () => {
  it('첫 페이지를 불러오고, 다음 페이지가 있으면 hasMore', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page(['a', 'b'], '2'))
    const { result } = renderHook(() => useCursorList(fetchPage))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(fetchPage).toHaveBeenCalledWith(undefined)
    expect(result.current.items).toEqual(['a', 'b'])
    expect(result.current.hasMore).toBe(true)
  })

  it('더 보기는 nextCursor로 다음 페이지를 불러와 뒤에 붙인다', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce(page(['a', 'b'], '2')).mockResolvedValueOnce(page(['c']))
    const { result } = renderHook(() => useCursorList(fetchPage))
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    await act(() => result.current.loadMore())

    expect(fetchPage).toHaveBeenLastCalledWith('2')
    expect(result.current.items).toEqual(['a', 'b', 'c'])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.loadingMore).toBe(false)
  })

  it('마지막 응답(page)을 그대로 돌려줘 totalCount 같은 값을 쓸 수 있다', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page(['a']))
    const { result } = renderHook(() => useCursorList(fetchPage))

    await waitFor(() => expect(result.current.page?.items).toEqual(['a']))
  })

  it('다음 페이지를 불러오지 못하면 목록은 그대로 두고 다시 누를 수 있게 한다', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce(page(['a'], '1')).mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useCursorList(fetchPage))
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    await act(() => result.current.loadMore())

    expect(result.current.status).toBe('ready')
    expect(result.current.items).toEqual(['a'])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.loadingMore).toBe(false)
  })

  it('필터(fetchPage)가 바뀌면 이전 커서를 쓰지 않고 첫 페이지부터 다시 불러온다', async () => {
    const first = vi.fn().mockResolvedValue(page(['a'], '1'))
    const second = deferred<ApiResponse<CursorPage<string>>>()
    const next = vi.fn().mockReturnValue(second.promise)
    const { result, rerender } = renderHook(({ fetchPage }) => useCursorList(fetchPage), {
      initialProps: { fetchPage: first },
    })
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    rerender({ fetchPage: next })

    // 새 필터의 첫 페이지가 오기 전에는 이전 필터의 커서로 더 보기를 하지 않는다 (커서는 필터에 묶여 있다)
    expect(result.current.stale).toBe(true)
    expect(result.current.hasMore).toBe(false)
    await act(() => result.current.loadMore())
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(undefined)

    await act(async () => second.resolve(page(['x'])))
    expect(result.current.items).toEqual(['x'])
    expect(result.current.stale).toBe(false)
  })

  it('필터가 바뀐 뒤 늦게 도착한 이전 필터의 응답은 버린다', async () => {
    const late = deferred<ApiResponse<CursorPage<string>>>()
    const first = vi.fn().mockReturnValue(late.promise)
    const next = vi.fn().mockResolvedValue(page(['x']))
    const { result, rerender } = renderHook(({ fetchPage }) => useCursorList(fetchPage), {
      initialProps: { fetchPage: first },
    })

    rerender({ fetchPage: next })
    await waitFor(() => expect(result.current.items).toEqual(['x']))
    await act(async () => late.resolve(page(['old'])))

    expect(result.current.items).toEqual(['x'])
  })

  it('더 보기 도중 필터가 바뀌면 늦게 온 다음 페이지를 붙이지 않는다', async () => {
    const more = deferred<ApiResponse<CursorPage<string>>>()
    const first = vi.fn().mockResolvedValueOnce(page(['a'], '1')).mockReturnValueOnce(more.promise)
    const next = vi.fn().mockResolvedValue(page(['x']))
    const { result, rerender } = renderHook(({ fetchPage }) => useCursorList(fetchPage), {
      initialProps: { fetchPage: first },
    })
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    let loading!: Promise<void>
    act(() => {
      loading = result.current.loadMore()
    })
    rerender({ fetchPage: next })
    await waitFor(() => expect(result.current.items).toEqual(['x']))
    await act(async () => {
      more.resolve(page(['b']))
      await loading
    })

    expect(result.current.items).toEqual(['x'])
  })

  it('불러오지 못하면 error, 다시 시도하면 첫 페이지부터 다시 불러온다', async () => {
    const fetchPage = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(page(['a']))
    const { result } = renderHook(() => useCursorList(fetchPage))
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.items).toEqual(['a'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('updateItems로 불러온 항목을 고칠 수 있다 (찜 하트 토글 등)', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page(['a', 'b']))
    const { result } = renderHook(() => useCursorList<string>(fetchPage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.updateItems((items) => items.map((item) => item.toUpperCase())))

    expect(result.current.items).toEqual(['A', 'B'])
  })
})
