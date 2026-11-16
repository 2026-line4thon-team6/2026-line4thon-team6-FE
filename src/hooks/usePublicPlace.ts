import { useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { fetchPublicPlace } from '@/api/places'
import type { PublicPlace } from '@/types/place'

interface State {
  status: 'loading' | 'ready' | 'notFound' | 'error'
  place: PublicPlace | null
}

const INITIAL: State = { status: 'loading', place: null }

// 공유 링크로 들어온 로그인 전 사용자가 보는 장소 (GET /public/places/{placeId}).
// 지워졌거나 잘못된 링크(404)는 다시 시도해도 소용없으므로 일반 오류와 나눠 안내한다
// 장소가 바뀌면 부모에서 key={placeId}로 새로 마운트한다
function usePublicPlace(placeId: string) {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchPublicPlace(placeId)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', place: data })
      })
      .catch((error: unknown) => {
        if (ignore) return
        const notFound = error instanceof ApiError && error.status === 404
        setState({ status: notFound ? 'notFound' : 'error', place: null })
      })

    return () => {
      ignore = true
    }
  }, [placeId, attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  return { ...state, retry }
}

export default usePublicPlace
