import { useEffect, useState } from 'react'
import { fetchMyCouple } from '@/api/couples'
import type { Couple } from '@/types/couple'

interface State {
  status: 'loading' | 'ready' | 'error'
  couple: Couple | null // 연결된 커플이 없으면 null
}

// 마이 화면의 커플 요약 (GET /couples/me). 화면에 들어올 때마다 새로 불러온다
function useMyCouple() {
  const [state, setState] = useState<State>({ status: 'loading', couple: null })

  useEffect(() => {
    let ignore = false

    fetchMyCouple()
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', couple: data.connectionStatus === 'CONNECTED' ? data.couple : null })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', couple: null })
      })

    return () => {
      ignore = true
    }
  }, [])

  return state
}

export default useMyCouple
