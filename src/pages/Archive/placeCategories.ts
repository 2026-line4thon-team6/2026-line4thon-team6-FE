import cafeIcon from '@/assets/images/category/cafe.svg'
import campingIcon from '@/assets/images/category/camping.svg'
import natureIcon from '@/assets/images/category/nature.svg'
import nightViewIcon from '@/assets/images/category/night-view.svg'
import seaIcon from '@/assets/images/category/sea.svg'
import type { PlaceCategory } from '@/types/place'

// 보관함 카테고리 칩. API 명세 GET /me/favorite-places의 category 5종, Figma 순서 그대로
export const PLACE_CATEGORIES: { value: PlaceCategory; label: string; icon: string }[] = [
  { value: 'SEA', label: '바다', icon: seaIcon },
  { value: 'NIGHT_VIEW', label: '야경', icon: nightViewIcon },
  { value: 'NEARBY_CAFE', label: '근교 카페', icon: cafeIcon },
  { value: 'NATURE', label: '자연', icon: natureIcon },
  { value: 'CAR_CAMPING', label: '차박', icon: campingIcon },
]
