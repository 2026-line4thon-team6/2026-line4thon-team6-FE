import { useEffect, useState } from 'react'
import { fetchRecordMap, type FetchRecordMapParams } from '@/api/records'
import type { RecordMapMarker } from '@/types/record'

export interface RecordMapFilter {
  q?: string
  date?: string // YYYY-MM-DD
}

interface State {
  status: 'loading' | 'ready' | 'error'
  markers: RecordMapMarker[]
  totalCount: number
}

const INITIAL: State = { status: 'loading', markers: [], totalCount: 0 }

// 한 번에 최대한 많이 받아 요청 수를 줄인다 (명세 최대 100)
const PAGE_SIZE = 100

// 지도 마커는 모든 페이지를 읽어야 완성된다 (GET /records/map)
async function fetchAllMarkers(filter: RecordMapFilter) {
  const base: FetchRecordMapParams = { limit: PAGE_SIZE, ...filter }
  let { data } = await fetchRecordMap(base)
  const markers = [...data.markers]
  const totalCount = data.totalCount

  while (data.hasMore && data.nextCursor) {
    ;({ data } = await fetchRecordMap({ ...base, cursor: data.nextCursor }))
    markers.push(...data.markers)
  }
  return { markers, totalCount }
}

// 기록 지도 마커 불러오기. 검색어 · 날짜가 바뀌면 다시 불러온다
// 화면 범위(bbox)로 나눠 받지 않고 전체를 받는다 — 상단의 '총 N번' 수가 지도를 움직여도 바뀌지 않게 한다
function useRecordMap({ q, date }: RecordMapFilter = {}) {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false
    const filter: RecordMapFilter = {}
    if (q) filter.q = q
    if (date) filter.date = date

    fetchAllMarkers(filter)
      .then(({ markers, totalCount }) => {
        if (!ignore) setState({ status: 'ready', markers, totalCount })
      })
      .catch(() => {
        if (!ignore) setState({ ...INITIAL, status: 'error' })
      })

    return () => {
      ignore = true
    }
  }, [q, date, attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  return { ...state, retry }
}

export default useRecordMap
