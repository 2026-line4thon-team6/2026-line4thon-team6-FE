import { useCallback, useState } from 'react'
import { fetchFavorites, setPlaceFavorite } from '@/api/places'
import { PLACE_CATEGORIES } from '@/pages/Archive/placeCategories'
import type { PlaceCategory, PlaceSummary } from '@/types/place'
import useCursorList from './useCursorList'

// 찜한 드라이브 코스 보관함 (GET /me/favorite-places).
// 홈 카테고리 칩처럼 항상 칩 하나가 골라져 있고, 처음에는 첫 칩(바다)을 보여 준다
function useFavorites() {
  const [category, setCategory] = useState<PlaceCategory>(PLACE_CATEGORIES[0].value)

  // 카테고리가 바뀌면 새 함수가 되어 첫 페이지부터 다시 불러온다 (커서는 카테고리에 묶여 있다)
  const fetchPage = useCallback((cursor: string | undefined) => fetchFavorites(category, { cursor }), [category])
  const { stale, updateItems, ...list } = useCursorList<PlaceSummary>(fetchPage)

  // 이미 고른 칩을 다시 누르면 그대로 둔다
  const selectCategory = (next: PlaceCategory) => {
    if (next !== category) setCategory(next)
  }

  const setFavorite = (placeId: string, isFavorite: boolean) =>
    updateItems((places) => places.map((place) => (place.id === placeId ? { ...place, isFavorite } : place)))

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

  // 칩을 바꾸면 새 카테고리 목록이 올 때까지 불러오는 중으로 보여 준다
  const status: typeof list.status = stale ? 'loading' : list.status

  return {
    status,
    places: list.items,
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    category,
    selectCategory,
    toggleFavorite,
    loadMore: list.loadMore,
    retry: list.retry,
  }
}

export default useFavorites
