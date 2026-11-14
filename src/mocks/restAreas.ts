import type { SearchRestAreasParams } from '@/api/restAreas'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { RestArea } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import { findMockDrive } from './drives'
import { findMockRoute } from './routes'
import { createMeta, distanceBetween, mockApiError, paginate } from './utils'

type RestAreaSeed = Pick<RestArea, 'id' | 'name' | 'highwayName' | 'direction' | 'coordinate'>

const REST_AREAS: RestAreaSeed[] = [
  {
    id: 'rest_mock_1',
    name: '시흥하늘휴게소',
    highwayName: '수도권제1순환고속도로',
    direction: null,
    coordinate: { latitude: 37.4103, longitude: 126.8263 },
  },
  {
    id: 'rest_mock_2',
    name: '화성휴게소',
    highwayName: '서해안고속도로',
    direction: '목포 방향',
    coordinate: { latitude: 37.1543, longitude: 126.8711 },
  },
  {
    id: 'rest_mock_3',
    name: '행담도휴게소',
    highwayName: '서해안고속도로',
    direction: null,
    coordinate: { latitude: 36.9418, longitude: 126.7804 },
  },
  {
    id: 'rest_mock_4',
    name: '덕평자연휴게소',
    highwayName: '영동고속도로',
    direction: null,
    coordinate: { latitude: 37.2265, longitude: 127.3932 },
  },
  {
    id: 'rest_mock_5',
    name: '여주휴게소',
    highwayName: '영동고속도로',
    direction: '강릉 방향',
    coordinate: { latitude: 37.2985, longitude: 127.6086 },
  },
  {
    id: 'rest_mock_6',
    name: '횡성휴게소',
    highwayName: '영동고속도로',
    direction: '강릉 방향',
    coordinate: { latitude: 37.4877, longitude: 128.0347 },
  },
]

const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

const toRestArea = (seed: RestAreaSeed, from?: Coordinate): RestArea => ({
  ...seed,
  distanceAlongRouteMeters: null,
  earned: false,
  earnedAt: null,
  address: seed.highwayName,
  distanceMeters: from ? distanceBetween(from, seed.coordinate) : null,
})

export async function mockSearchRestAreas({
  q,
  coordinate,
  cursor,
  limit = 20,
}: SearchRestAreasParams = {}): Promise<ApiResponse<CursorPage<RestArea>>> {
  const keyword = q ? normalize(q) : ''
  const all = REST_AREAS.map((seed) => toRestArea(seed, coordinate))
    .filter((area) => !keyword || normalize(area.name).includes(keyword) || normalize(area.highwayName).includes(keyword))
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))

  return { data: paginate(all, cursor, limit), meta: createMeta() }
}

// 실제 경로 대신 출발지~목적지 거리 안의 휴게소를 돌려준다
export async function mockGetDriveRestAreas(
  driveId: string,
  { cursor, limit = 20 }: { cursor?: string; limit?: number } = {},
): Promise<ApiResponse<CursorPage<RestArea>>> {
  const drive = findMockDrive(driveId)
  if (!drive) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '드라이브를 찾을 수 없어요.')

  const route = drive.routeId ? findMockRoute(drive.routeId) : null
  if (!route) return { data: { items: [], nextCursor: null, hasMore: false }, meta: createMeta() }

  const from = route.origin.coordinate
  const total = distanceBetween(from, route.destination.coordinate)
  const all = REST_AREAS.map((seed) => {
    const area = toRestArea(seed, from)
    return { ...area, distanceAlongRouteMeters: area.distanceMeters }
  })
    .filter((area) => (area.distanceMeters ?? Infinity) <= total)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))

  return { data: paginate(all, cursor, limit), meta: createMeta() }
}
