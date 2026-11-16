import { useEffect, useState } from 'react'
import { fetchRecommendations, setPlaceFavorite } from '@/api/places'
import type { PlaceCategory, PlaceSummary } from '@/types/place'

type Cache = Partial<Record<PlaceCategory, PlaceSummary[]>>

const updateFavorite = (cache: Cache, placeId: string, favorite: boolean): Cache =>
  Object.fromEntries(
    Object.entries(cache).map(([category, places]) => [
      category,
      places.map((place) => (place.id === placeId ? { ...place, isFavorite: favorite } : place)),
    ]),
  )

// 홈 '스마트 탐색 & 큐레이션'의 카테고리별 추천 장소 (GET /places/recommendations)
// 한 번 불러온 카테고리는 앱이 켜져 있는 동안 다시 요청하지 않는다. enabled: 로그인한 뒤에만 부른다
function useRecommendations(enabled: boolean) {
  const [category, setCategory] = useState<PlaceCategory>('SEA')
  const [cache, setCache] = useState<Cache>({})
  const loaded = cache[category] !== undefined

  useEffect(() => {
    if (!enabled || loaded) return
    let ignore = false
    fetchRecommendations(category)
      .then(({ data }) => {
        if (!ignore) setCache((prev) => ({ ...prev, [category]: data.items }))
      })
      .catch(() => {
        // 불러오지 못하면 안내 문구를 그대로 두고, 카테고리를 다시 고르면 재시도한다
      })
    return () => {
      ignore = true
    }
  }, [enabled, category, loaded])

  // 다른 화면에서 바꾼 찜 상태를 맞춘다 (서버 요청 없음)
  const syncFavorite = (placeId: string, favorite: boolean) =>
    setCache((prev) => updateFavorite(prev, placeId, favorite))

  // 홈 카드의 하트: 화면을 먼저 바꾸고 저장한다. 실패하면 되돌린다
  const toggleFavorite = async (placeId: string, favorite: boolean) => {
    syncFavorite(placeId, favorite)
    try {
      await setPlaceFavorite(placeId, favorite)
    } catch {
      syncFavorite(placeId, !favorite)
    }
  }

  return {
    category,
    setCategory,
    // 아직 불러오지 않았으면 null
    places: cache[category] ?? null,
    toggleFavorite,
    syncFavorite,
  }
}

export default useRecommendations
