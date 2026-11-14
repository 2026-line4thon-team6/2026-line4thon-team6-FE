import { ApiError } from '@/api/client'
import type { ApiMeta } from '@/types/api'
import type { Coordinate } from '@/types/route'

let requestCount = 0

export const createMeta = (): ApiMeta => ({
  requestId: `req_mock_drive_${++requestCount}`,
  serverTime: new Date().toISOString(),
})

export function mockApiError(status: number, code: string, message: string) {
  return new ApiError(status, {
    error: { code, message, details: [], retryable: false },
    meta: createMeta(),
  })
}

// 직선 거리(m)
export function distanceBetween(from: Coordinate, to: Coordinate) {
  const R = 6371000
  const rad = (degree: number) => (degree * Math.PI) / 180
  const dLat = rad(to.latitude - from.latitude)
  const dLng = rad(to.longitude - from.longitude)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

// Route.polyline과 같은 인코딩 형식
export function encodePolyline(points: Coordinate[]) {
  let previousLat = 0
  let previousLng = 0
  let result = ''

  const encode = (value: number) => {
    let rest = value < 0 ? ~(value << 1) : value << 1
    let chunk = ''
    while (rest >= 0x20) {
      chunk += String.fromCharCode((0x20 | (rest & 0x1f)) + 63)
      rest >>= 5
    }
    return chunk + String.fromCharCode(rest + 63)
  }

  for (const { latitude, longitude } of points) {
    const lat = Math.round(latitude * 1e5)
    const lng = Math.round(longitude * 1e5)
    result += encode(lat - previousLat) + encode(lng - previousLng)
    previousLat = lat
    previousLng = lng
  }
  return result
}

// 커서 = 다음 시작 위치
export function paginate<T>(all: T[], cursor: string | undefined, limit = 20) {
  const start = cursor ? Number(cursor) : 0
  const items = all.slice(start, start + limit)
  const hasMore = start + limit < all.length
  return { items, nextCursor: hasMore ? String(start + limit) : null, hasMore }
}
