import { mockFetchHome } from '@/mocks/home'
import type { ApiResponse } from '@/types/api'
import type { HomeResponse } from '@/types/home'
import type { Coordinate } from '@/types/route'
import { apiFetch, USE_MOCK } from './client'

// GET /home — 홈 첫 화면. 내 정보 · 커플 · 미읽음 알림 수 · 진행 중 드라이브 · 미작성 카드 · 주변 날씨
// 좌표를 보내야 context(날씨)가 채워진다. 위도 · 경도는 둘 다 보내거나 둘 다 뺀다
export function fetchHome(coordinate?: Coordinate | null): Promise<ApiResponse<HomeResponse>> {
  if (USE_MOCK) return mockFetchHome()

  const query = coordinate
    ? `?${new URLSearchParams({ latitude: String(coordinate.latitude), longitude: String(coordinate.longitude) })}`
    : ''
  return apiFetch<HomeResponse>(`/home${query}`)
}
