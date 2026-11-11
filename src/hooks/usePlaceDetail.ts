import { useEffect, useRef, useState } from 'react'
import { fetchPlaceDetail, fetchPlaceShare, sendPlaceToPartner, setPlaceFavorite } from '@/api/places'
import type { PlaceDetail } from '@/types/place'

interface State {
  status: 'loading' | 'ready' | 'error'
  detail: PlaceDetail | null
}

const INITIAL: State = { status: 'loading', detail: null }

// 장소 상세 불러오기 · 찜 · 공유 링크 · 연인에게 보내기
// 장소가 바뀌면 부모에서 key={placeId}로 새로 마운트한다
function usePlaceDetail(placeId: string) {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)
  const shareUrl = useRef<Promise<string> | null>(null)

  useEffect(() => {
    let ignore = false

    fetchPlaceDetail(placeId)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', detail: data })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', detail: null })
      })

    return () => {
      ignore = true
    }
  }, [placeId, attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  const setFavorite = (isFavorite: boolean) =>
    setState((prev) =>
      prev.detail ? { ...prev, detail: { ...prev.detail, place: { ...prev.detail.place, isFavorite } } } : prev,
    )

  // 화면에는 바로 반영하고, 저장에 실패하면 되돌린다. 성공 여부를 돌려준다
  const toggleFavorite = async (favorite: boolean) => {
    setFavorite(favorite)
    try {
      await setPlaceFavorite(placeId, favorite)
      return true
    } catch {
      setFavorite(!favorite)
      return false
    }
  }

  // 공유 링크는 처음 필요할 때 한 번만 받아 온다. 실패하면 다음에 다시 시도한다
  const getShareUrl = () => {
    shareUrl.current ??= fetchPlaceShare(placeId)
      .then(({ data }) => data.url)
      .catch((error: unknown) => {
        shareUrl.current = null
        throw error
      })
    return shareUrl.current
  }

  const sendToPartner = async (options: { idempotencyKey: string; coupleId: string }) => {
    await sendPlaceToPartner(placeId, options)
  }

  return { ...state, retry, toggleFavorite, getShareUrl, sendToPartner }
}

export default usePlaceDetail
