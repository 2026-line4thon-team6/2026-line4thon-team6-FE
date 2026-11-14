import { useCallback, useEffect, useState } from 'react'
import { fetchFavorites, setPlaceFavorite } from '@/api/places'
import { PLACE_CATEGORIES } from '@/pages/Archive/placeCategories'
import type { PlaceCategory, PlaceSummary } from '@/types/place'

interface State {
  status: 'loading' | 'ready' | 'error'
  places: PlaceSummary[]
}

// 찜한 드라이브 코스 보관함 (GET /me/favorite-places).
// 홈 카테고리 칩처럼 항상 칩 하나가 골라져 있고, 처음에는 첫 칩(바다)을 보여 준다
function useFavorites() {
  const [category, setCategory] = useState<PlaceCategory>(PLACE_CATEGORIES[0].value)
  const [state, setState] = useState<State>({ status: 'loading', places: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchFavorites(category)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', places: data.items })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', places: [] })
      })

    return () => {
      ignore = true
    }
  }, [category, attempt])

  // 이미 고른 칩을 다시 누르면 그대로 둔다
  const selectCategory = (next: PlaceCategory) => {
    if (next === category) return
    setState((prev) => ({ ...prev, status: 'loading' }))
    setCategory(next)
  }

  const retry = () => {
    setState((prev) => ({ ...prev, status: 'loading' }))
    setAttempt((count) => count + 1)
  }

  const setFavorite = useCallback((placeId: string, isFavorite: boolean) => {
    setState((prev) => ({
      ...prev,
      places: prev.places.map((place) => (place.id === placeId ? { ...place, isFavorite } : place)),
    }))
  }, [])

  // 하트를 먼저 바꾸고, 저장에 실패하면 되돌린다. 취소한 장소도 다시 찜할 수 있게 목록에 남겨 둔다.
  // 저장에 성공했는지 돌려준다
  const toggleFavorite = async (placeId: string, favorite: boolean) => {
    setFavorite(placeId, favorite)
    try {
      await setPlaceFavorite(placeId, favorite)
      return true
    } catch {
      setFavorite(placeId, !favorite)
      return false
    }
  }

  return { ...state, category, selectCategory, toggleFavorite, retry }
}

export default useFavorites
