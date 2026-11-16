import { PLACE_CATEGORIES } from '@/pages/Archive/placeCategories'

const DAY_MS = 24 * 60 * 60 * 1000
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

// 홈 '추천 테마'. 백엔드가 아직 값을 주지 않아(null) FE가 장소 카테고리 5가지를 하루에 하나씩 돌린다.
// 기기 시간대와 상관없이 한국 날짜 기준으로 자정에 바뀐다. 예) 바다 드라이브 → 야경 드라이브 → … → 차박 드라이브
export function getDailyTheme(date: Date = new Date()): string {
  const seoulDay = Math.floor((date.getTime() + SEOUL_OFFSET_MS) / DAY_MS)
  return `${PLACE_CATEGORIES[seoulDay % PLACE_CATEGORIES.length].label} 드라이브`
}
