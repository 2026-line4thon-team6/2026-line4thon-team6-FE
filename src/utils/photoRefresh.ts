import type { CardPhoto } from '@/types/card'

// 만료 30초 전에 새 링크를 받는다 (요청 · 렌더 시간 여유)
const REFRESH_MARGIN_MS = 30_000
// setTimeout이 잴 수 있는 최대 지연(약 24.8일). 넘으면 바로 실행되므로 그때는 예약하지 않는다
const MAX_TIMEOUT_MS = 2 ** 31 - 1

// 카드 사진 링크(서명 URL)는 10분 뒤 만료된다. 화면을 오래 띄워 두어도 사진이 깨지지 않도록
// 가장 먼저 만료되는 링크 기준으로 다시 불러올 때까지 남은 시간(ms)을 구한다. 예약할 필요가 없으면 null
export function photoRefreshDelay(photos: CardPhoto[], now: number): number | null {
  if (photos.length === 0) return null
  const earliest = Math.min(...photos.map((photo) => Date.parse(photo.urlExpiresAt)))
  const delay = Math.max(0, earliest - REFRESH_MARGIN_MS - now)
  return delay > MAX_TIMEOUT_MS ? null : delay
}
