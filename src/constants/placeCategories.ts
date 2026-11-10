import cafeIcon from '@/assets/images/category/cafe.svg'
import campingIcon from '@/assets/images/category/camping.svg'
import natureIcon from '@/assets/images/category/nature.svg'
import nightViewIcon from '@/assets/images/category/night-view.svg'
import seaIcon from '@/assets/images/category/sea.svg'
import type { PlaceCategory } from '@/types/place'

// API의 카테고리 값 → 화면 표시 이름과 아이콘
export const PLACE_CATEGORIES: Record<PlaceCategory, { label: string; icon: string }> = {
  SEA: { label: '바다', icon: seaIcon },
  NIGHT_VIEW: { label: '야경', icon: nightViewIcon },
  NEARBY_CAFE: { label: '근교 카페', icon: cafeIcon },
  NATURE: { label: '자연', icon: natureIcon },
  CAR_CAMPING: { label: '차박', icon: campingIcon },
}
