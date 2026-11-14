// 홈 배너의 시간대 (Figma '시간대별 배너 이미지' 609:10169).
// 디자인은 새벽 · 아침~낮 · 저녁 · 밤 네 장이고 시간은 FE가 나눈다. 기기 시간대와 상관없이 한국 시간 기준
export type TimeOfDay = 'dawn' | 'day' | 'evening' | 'night'

const SEOUL_OFFSET_HOURS = 9

// 새벽 05~09시 · 아침~낮 09~17시 · 저녁 17~20시 · 밤 20~05시
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = (date.getUTCHours() + SEOUL_OFFSET_HOURS) % 24
  if (hour >= 5 && hour < 9) return 'dawn'
  if (hour >= 9 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}
