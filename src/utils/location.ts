import { USE_MOCK } from '@/api/client'
import { MOCK_CURRENT_COORDINATE } from '@/mocks/search'
import type { Coordinate } from '@/types/route'

// 위치 권한이 없거나 실패하면 null. 목 모드에서는 Figma의 '서초구 서초동' 좌표를 쓴다
export function getCurrentCoordinate(): Promise<Coordinate | null> {
  if (USE_MOCK) return Promise.resolve(MOCK_CURRENT_COORDINATE)
  if (!navigator.geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60_000 },
    )
  })
}
