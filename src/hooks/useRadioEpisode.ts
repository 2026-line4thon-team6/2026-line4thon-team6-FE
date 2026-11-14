import { useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { fetchRadioEpisode } from '@/api/radio'
import type { RadioEpisode } from '@/types/radio'

interface State {
  status: 'loading' | 'ready' | 'notFound' | 'error'
  episode: RadioEpisode | null
}

// 라디오 사연 상세 (GET /radio/episodes/{episodeId})
function useRadioEpisode(episodeId: string) {
  const [state, setState] = useState<State>({ status: 'loading', episode: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchRadioEpisode(episodeId)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', episode: data })
      })
      .catch((error: unknown) => {
        if (ignore) return
        const notFound = error instanceof ApiError && error.status === 404
        setState({ status: notFound ? 'notFound' : 'error', episode: null })
      })

    return () => {
      ignore = true
    }
  }, [episodeId, attempt])

  const retry = () => {
    setState({ status: 'loading', episode: null })
    setAttempt((count) => count + 1)
  }

  // 음성 URL이 만료돼 재생에 실패하면 다시 조회해 새 URL을 받는다. 방송 문구는 그대로 보여 준다
  const refreshAudio = () => setAttempt((count) => count + 1)

  return { ...state, retry, refreshAudio }
}

export default useRadioEpisode
