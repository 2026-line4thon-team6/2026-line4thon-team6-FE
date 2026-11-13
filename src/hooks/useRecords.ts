import { useEffect, useRef, useState } from 'react'
import { fetchRecords, type FetchRecordsParams } from '@/api/records'
import type { RecordSummary } from '@/types/record'
import type { RecordMapFilter } from './useRecordMap'

interface State {
  status: 'loading' | 'ready' | 'error'
  records: RecordSummary[]
  filteredCount: number
  nextCursor: string | null
  loadingMore: boolean
}

const INITIAL: State = { status: 'loading', records: [], filteredCount: 0, nextCursor: null, loadingMore: false }

// 값이 있는 조건만 요청에 담는다
function toParams({ q, date }: RecordMapFilter): FetchRecordsParams {
  const params: FetchRecordsParams = {}
  if (q) params.q = q
  if (date) params.date = date
  return params
}

// 기록 목록 불러오기 · 더 보기 (GET /records). 검색어 · 날짜가 바뀌면 첫 페이지부터 다시 불러온다.
// totalCount(전체 기록 수)는 조건과 관계없어 다시 불러오는 동안에도 이전 값을 유지한다
function useRecords({ q, date }: RecordMapFilter = {}) {
  const [state, setState] = useState<State>(INITIAL)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  // 더 보기 응답이 도착했을 때 조건이 바뀌었으면 버리기 위한 요청 번호
  const requestId = useRef(0)

  // 조건이 바뀌거나 다시 시도하면 렌더링 중에 바로 목록을 비운다 (effect 안에서 setState 하지 않음)
  const key = [q ?? '', date ?? '', attempt].join('|')
  const [loadedKey, setLoadedKey] = useState(key)
  if (loadedKey !== key) {
    setLoadedKey(key)
    setState(INITIAL)
  }

  useEffect(() => {
    let ignore = false
    const id = ++requestId.current

    fetchRecords(toParams({ q, date }))
      .then(({ data }) => {
        if (ignore || id !== requestId.current) return
        setTotalCount(data.totalCount)
        setState({
          status: 'ready',
          records: data.items,
          filteredCount: data.filteredCount,
          nextCursor: data.hasMore ? data.nextCursor : null,
          loadingMore: false,
        })
      })
      .catch(() => {
        if (!ignore) setState({ ...INITIAL, status: 'error' })
      })

    return () => {
      ignore = true
    }
  }, [q, date, attempt])

  const retry = () => setAttempt((count) => count + 1)

  const loadMore = async () => {
    const cursor = state.nextCursor
    if (!cursor || state.loadingMore) return

    const id = requestId.current
    setState((prev) => ({ ...prev, loadingMore: true }))
    try {
      const { data } = await fetchRecords({ ...toParams({ q, date }), cursor })
      if (id !== requestId.current) return
      setState((prev) => ({
        ...prev,
        records: [...prev.records, ...data.items],
        nextCursor: data.hasMore ? data.nextCursor : null,
        loadingMore: false,
      }))
    } catch {
      // 실패하면 다음 스크롤에서 다시 시도할 수 있게만 한다
      if (id === requestId.current) setState((prev) => ({ ...prev, loadingMore: false }))
    }
  }

  return {
    status: state.status,
    records: state.records,
    totalCount,
    filteredCount: state.filteredCount,
    hasMore: state.nextCursor !== null,
    loadingMore: state.loadingMore,
    loadMore,
    retry,
  }
}

export default useRecords
