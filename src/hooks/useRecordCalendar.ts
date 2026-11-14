import { useEffect, useState } from 'react'
import { fetchRecordCalendar } from '@/api/records'

interface State {
  status: 'loading' | 'ready' | 'error'
  recordDates: Set<string>
}

const INITIAL: State = { status: 'loading', recordDates: new Set() }

// 날짜 검색 달력에서 그 달(YYYY-MM)에 기록이 있는 날짜를 불러온다 (GET /records/calendar).
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
        if (!ignore) setState({ status: 'ready', recordDates: new Set(data.days.map((day) => day.date)) })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', recordDates: new Set() })
      })

    return () => {
      ignore = true
    }
  }, [month, attempt])

  return { ...state, retry: () => setAttempt((count) => count + 1) }
}

export default useRecordCalendar
