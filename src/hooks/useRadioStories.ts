import { useEffect, useState } from 'react'
import { fetchRadioHistory } from '@/api/radio'
import type { RadioEpisode } from '@/types/radio'

// 입력을 멈추고 이만큼 지나면 검색한다 (글자마다 요청하지 않게)
const SEARCH_DELAY_MS = 300

interface State {
  status: 'loading' | 'ready' | 'error'
  episodes: RadioEpisode[]
}

// 라디오 사연 보관함 · 검색 (GET /radio/episodes?q=)
function useRadioStories() {
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const [state, setState] = useState<State>({ status: 'loading', episodes: [] })
  const [attempt, setAttempt] = useState(0)

  // 앞뒤 공백을 뺀 검색어가 바뀌었을 때만 검색한다
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let ignore = false

    fetchRadioHistory(keyword)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', episodes: data.items })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', episodes: [] })
      })

    return () => {
      ignore = true
    }
  }, [keyword, attempt])

  const retry = () => {
    setState({ status: 'loading', episodes: [] })
    setAttempt((count) => count + 1)
  }

  return { ...state, query, setQuery, keyword, retry }
}

export default useRadioStories
