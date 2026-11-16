import { useEffect, useState } from 'react'
import { fetchRecordCalendar } from '@/api/records'

interface State {
  status: 'loading' | 'ready' | 'error'
  // 기록이 있는 날짜(YYYY-MM-DD)와 그날의 기록 수
  recordCounts: Map<string, number>
}

const INITIAL: State = { status: 'loading', recordCounts: new Map() }

// 날짜 검색 달력에서 그 달(YYYY-MM)에 기록이 있는 날짜와 그날의 기록 수를 불러온다 (GET /records/calendar).
// 달이 바뀌면 이전 달 날짜를 바로 비우고, 늦게 도착한 이전 달 응답은 버린다
function useRecordCalendar(month: string) {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)

  // 달이 바뀌거나 다시 시도하면 렌더링 중에 바로 비운다 (effect 안에서 setState 하지 않음)
  const key = `${month}|${attempt}`
  const [loadedKey, setLoadedKey] = useState(key)
  if (loadedKey !== key) {
    setLoadedKey(key)
    setState(INITIAL)
  }

  useEffect(() => {
    let ignore = false

    fetchRecordCalendar(month)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', recordCounts: new Map(data.days.map((day) => [day.date, day.count])) })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', recordCounts: new Map() })
      })

    return () => {
      ignore = true
    }
  }, [month, attempt])

  return { ...state, retry: () => setAttempt((count) => count + 1) }
}

export default useRecordCalendar
