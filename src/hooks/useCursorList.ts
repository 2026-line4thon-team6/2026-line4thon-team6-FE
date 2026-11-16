import { useEffect, useRef, useState } from 'react'
import type { ApiResponse, CursorPage } from '@/types/api'

// cursor가 없으면 첫 페이지
export type FetchCursorPage<P> = (cursor: string | undefined) => Promise<ApiResponse<P>>

interface State<T, P> {
  status: 'loading' | 'ready' | 'error'
  items: T[]
  // 마지막 응답. 목록 밖의 값(플레이리스트 totalCount 등)을 꺼내 쓴다
  page: P | null
  nextCursor: string | null
  loadingMore: boolean
  // 지금 목록을 불러온 fetchPage. 필터가 바뀌었는지 판단하는 데 쓴다
  source: FetchCursorPage<P> | null
}

// 보관함 목록 공통 커서 페이지네이션. 알림 목록(useNotifications)과 같은 '더 보기' 방식이다.
// fetchPage는 필터(검색어 · 카테고리)가 바뀔 때만 새로 만들어야 한다 (모듈 함수 또는 useCallback).
// 서버 커서는 필터에 묶여 있어서, 필터가 바뀌면 이전 커서를 버리고 첫 페이지부터 다시 불러온다
function useCursorList<T, P extends CursorPage<T> = CursorPage<T>>(fetchPage: FetchCursorPage<P>) {
  const [state, setState] = useState<State<T, P>>({
    status: 'loading',
    items: [],
    page: null,
    nextCursor: null,
    loadingMore: false,
    source: null,
  })
  // 값을 바꾸면 첫 페이지부터 다시 불러온다
  const [attempt, setAttempt] = useState(0)
  // 첫 페이지를 새로 요청할 때마다 올린다. 그 전에 보낸 더 보기 응답은 버린다
  const generation = useRef(0)

  useEffect(() => {
    let ignore = false
    generation.current += 1

    fetchPage(undefined)
      .then(({ data }) => {
        if (ignore) return
        setState({
          status: 'ready',
          items: data.items,
          page: data,
          nextCursor: data.hasMore ? data.nextCursor : null,
          loadingMore: false,
          source: fetchPage,
        })
      })
      .catch(() => {
        if (!ignore) {
          setState({ status: 'error', items: [], page: null, nextCursor: null, loadingMore: false, source: fetchPage })
        }
      })

    return () => {
      ignore = true
    }
  }, [fetchPage, attempt])

  // 필터가 바뀌어 새 첫 페이지를 기다리는 중
  const stale = state.source !== fetchPage

  const retry = () => {
    setState((prev) => ({ ...prev, status: 'loading', nextCursor: null, loadingMore: false }))
    setAttempt((count) => count + 1)
  }

  const loadMore = async () => {
    const cursor = state.nextCursor
    if (!cursor || state.loadingMore || stale) return

    const requested = generation.current
    setState((prev) => ({ ...prev, loadingMore: true }))
    try {
      const { data } = await fetchPage(cursor)
      if (generation.current !== requested) return
      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...data.items],
        page: data,
        nextCursor: data.hasMore ? data.nextCursor : null,
        loadingMore: false,
      }))
    } catch {
      // 실패하면 버튼을 다시 누를 수 있게만 한다
      if (generation.current === requested) setState((prev) => ({ ...prev, loadingMore: false }))
    }
  }

  const updateItems = (update: (items: T[]) => T[]) => setState((prev) => ({ ...prev, items: update(prev.items) }))

  return {
    status: state.status,
    items: state.items,
    page: state.page,
    stale,
    hasMore: state.nextCursor !== null && !stale,
    loadingMore: state.loadingMore && !stale,
    retry,
    loadMore,
    updateItems,
  }
}

export default useCursorList
