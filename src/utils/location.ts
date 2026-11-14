import { USE_MOCK } from '@/api/client'
import { MOCK_CURRENT_COORDINATE } from '@/mocks/search'
import type { Coordinate } from '@/types/route'

export interface Position {
  coordinate: Coordinate
  accuracyMeters: number
}

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

const toPosition = ({ coords }: GeolocationPosition): Position => ({
  coordinate: { latitude: coords.latitude, longitude: coords.longitude },
  accuracyMeters: coords.accuracy,
})

const HIGH_ACCURACY: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10_000 }

// 위치가 바뀔 때마다 알려 준다. 권한이 꺼져 있으면 onDenied. 해제 함수를 돌려준다
export function watchPosition(onChange: (position: Position) => void, onDenied?: () => void): () => void {
  if (USE_MOCK) {
    onChange({ coordinate: MOCK_CURRENT_COORDINATE, accuracyMeters: 10 })
    return () => {}
  }
  if (!navigator.geolocation) {
    onDenied?.()
    return () => {}
  }

  const id = navigator.geolocation.watchPosition(
    (position) => onChange(toPosition(position)),
    (error) => error.code === error.PERMISSION_DENIED && onDenied?.(),
    HIGH_ACCURACY,
  )
  return () => navigator.geolocation.clearWatch(id)
}

// 위치를 한 번 다시 요청한다. 권한이 꺼져 있거나 실패하면 null
export function requestPosition(): Promise<Position | null> {
  if (USE_MOCK) return Promise.resolve({ coordinate: MOCK_CURRENT_COORDINATE, accuracyMeters: 10 })
  if (!navigator.geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toPosition(position)),
      () => resolve(null),
      HIGH_ACCURACY,
    )
  })
}

export function distanceMeters(from: Coordinate, to: Coordinate) {
  const R = 6371000
  const rad = (degree: number) => (degree * Math.PI) / 180
  const dLat = rad(to.latitude - from.latitude)
  const dLng = rad(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
