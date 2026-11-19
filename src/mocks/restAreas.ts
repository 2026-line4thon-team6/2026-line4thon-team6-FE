import type { SearchRestAreasParams } from '@/api/restAreas'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { RestArea, RestAreaDetail, RestAreaMenu, StampBook, StampClaim, StampClaimRequest } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import { alongDemoRoute, demoTraveledMeters, isDemoRoute, mockCurrentCoordinate } from './demoDrive'
import { findMockDrive } from './drives'
import { findMockRoute } from './routes'
import { createMeta, distanceBetween, mockApiError, paginate } from './utils'

type RestAreaSeed = Pick<RestArea, 'id' | 'name' | 'highwayName' | 'direction' | 'coordinate'>

const REST_AREAS: RestAreaSeed[] = [
  { id: 'rest_mock_1', name: '시흥하늘휴게소', highwayName: '수도권제1순환고속도로', direction: null, coordinate: { latitude: 37.4103, longitude: 126.8263 } },
  { id: 'rest_mock_2', name: '화성휴게소', highwayName: '서해안고속도로', direction: '목포 방향', coordinate: { latitude: 37.1543, longitude: 126.8711 } },
  { id: 'rest_mock_3', name: '행담도휴게소', highwayName: '서해안고속도로', direction: null, coordinate: { latitude: 36.9418, longitude: 126.7804 } },
  { id: 'rest_mock_4', name: '덕평자연휴게소', highwayName: '영동고속도로', direction: null, coordinate: { latitude: 37.2265, longitude: 127.3932 } },
  { id: 'rest_mock_5', name: '여주휴게소', highwayName: '영동고속도로', direction: '강릉 방향', coordinate: { latitude: 37.2985, longitude: 127.6086 } },
  { id: 'rest_mock_6', name: '횡성휴게소', highwayName: '영동고속도로', direction: '강릉 방향', coordinate: { latitude: 37.4877, longitude: 128.0347 } },
  { id: 'rest_mock_7', name: '안성휴게소', highwayName: '경부고속도로', direction: '부산 방향', coordinate: { latitude: 37.0177, longitude: 127.2196 } },
  { id: 'rest_mock_8', name: '망향휴게소', highwayName: '경부고속도로', direction: '부산 방향', coordinate: { latitude: 36.9012, longitude: 127.1855 } },
  { id: 'rest_mock_9', name: '가평휴게소', highwayName: '서울양양고속도로', direction: '양양 방향', coordinate: { latitude: 37.7464, longitude: 127.4441 } },
  { id: 'rest_mock_10', name: '내린천휴게소', highwayName: '서울양양고속도로', direction: '양양 방향', coordinate: { latitude: 37.9407, longitude: 128.1918 } },
  { id: 'rest_mock_11', name: '강릉대관령휴게소', highwayName: '영동고속도로', direction: '강릉 방향', coordinate: { latitude: 37.691, longitude: 128.773 } },
  { id: 'rest_mock_12', name: '서산휴게소', highwayName: '서해안고속도로', direction: '목포 방향', coordinate: { latitude: 36.7811, longitude: 126.4844 } },
  { id: 'rest_mock_13', name: '정안알밤휴게소', highwayName: '논산천안고속도로', direction: '논산 방향', coordinate: { latitude: 36.5642, longitude: 127.0909 } },
  { id: 'rest_mock_14', name: '금강휴게소', highwayName: '경부고속도로', direction: '부산 방향', coordinate: { latitude: 36.285, longitude: 127.638 } },
  { id: 'rest_mock_15', name: '문경휴게소', highwayName: '중부내륙고속도로', direction: '창원 방향', coordinate: { latitude: 36.682, longitude: 128.0874 } },
  { id: 'rest_mock_16', name: '함평천지휴게소', highwayName: '서해안고속도로', direction: '목포 방향', coordinate: { latitude: 35.095, longitude: 126.5165 } },
  { id: 'rest_mock_17', name: '평창휴게소', highwayName: '영동고속도로', direction: '강릉 방향', coordinate: { latitude: 37.5578, longitude: 128.3359 } },
  { id: 'rest_mock_18', name: '양평휴게소', highwayName: '광주원주고속도로', direction: '원주 방향', coordinate: { latitude: 37.3849, longitude: 127.567 } },
]

// 시연 경로(안목해변 가는 길)의 휴게소. 강릉대관령휴게소는 시연 중에 찍도록 비워 둔다
const INITIAL_EARNED: Record<string, string> = {
  rest_mock_18: '2026-10-25T05:00:00Z',
  rest_mock_6: '2026-10-25T07:30:00Z',
  rest_mock_17: '2026-11-01T04:10:00Z',
}
let earned = new Map(Object.entries(INITIAL_EARNED))
const claims = new Map<string, StampClaim>()
let claimCount = 0

export function resetMockStamps() {
  earned = new Map(Object.entries(INITIAL_EARNED))
  claims.clear()
  claimCount = 0
}

const MENUS: RestAreaMenu[] = [
  { name: '돼지고기 김치찌개', imageUrl: null },
  { name: '돈가츠 오므라이스', imageUrl: null },
  { name: '숯불고기 물냉면', imageUrl: null },
  { name: '묵은지 김치찜 솥밥', imageUrl: null },
]
const NO_MENU = new Set(['rest_mock_16'])

const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

const toRestArea = (seed: RestAreaSeed, from?: Coordinate): RestArea => ({
  ...seed,
  distanceAlongRouteMeters: null,
  earned: earned.has(seed.id),
  earnedAt: earned.get(seed.id) ?? null,
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

export async function mockGetDriveRestAreas(
  driveId: string,
  { cursor, limit = 20 }: { cursor?: string; limit?: number } = {},
): Promise<ApiResponse<CursorPage<RestArea>>> {
  const drive = findMockDrive(driveId)
  if (!drive) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '드라이브를 찾을 수 없어요.')

  const route = drive.routeId ? findMockRoute(drive.routeId) : null
  if (!route) return { data: { items: [], nextCursor: null, hasMore: false }, meta: createMeta() }

  if (isDemoRoute(route)) {
    const traveled = demoTraveledMeters(driveId)
    const onRoute = REST_AREAS.flatMap((seed) => {
      const along = alongDemoRoute(seed.coordinate)
      return along === null ? [] : [{ ...toRestArea(seed), distanceAlongRouteMeters: Math.round(along - traveled) }]
    }).sort((a, b) => (a.distanceAlongRouteMeters ?? 0) - (b.distanceAlongRouteMeters ?? 0))
    return { data: paginate(onRoute, cursor, limit), meta: createMeta() }
  }

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

export const hasMockStamp = (restAreaId: string) => earned.has(restAreaId)

export const findMockRestAreaCoordinate = (restAreaId: string) => findSeed(restAreaId).coordinate

const findSeed = (restAreaId: string) => {
  const seed = REST_AREAS.find((area) => area.id === restAreaId)
  if (!seed) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '휴게소를 찾을 수 없어요.')
  return seed
}

export async function mockGetRestArea(restAreaId: string): Promise<ApiResponse<RestAreaDetail>> {
  const restArea = toRestArea(findSeed(restAreaId))
  const menus = NO_MENU.has(restAreaId) ? [] : MENUS
  return {
    data: { restArea, introduction: null, menus, detailsAvailable: menus.length > 0 },
    meta: createMeta(),
  }
}

export async function mockGetStampBook({
  cursor,
  limit = 20,
}: { cursor?: string; limit?: number } = {}): Promise<ApiResponse<StampBook>> {
  const all = REST_AREAS.map((seed) => toRestArea(seed))
  return {
    data: {
      earnedCount: earned.size,
      catalogCount: all.length,
      capacity: all.length,
      ...paginate(all, cursor, limit),
    },
    meta: createMeta(),
  }
}

const VISIT_RADIUS = 1000

// 시연 드라이브는 붕붕이 위치가 휴게소 근처일 때만 방문을 인정한다
function rejectedClaim(now: string): StampClaim {
  const claim: StampClaim = {
    id: `claim_mock_${++claimCount}`,
    status: 'REJECTED',
    reason: '휴게소 방문을 확인하지 못했어요. 휴게소에 도착한 뒤 찍어 주세요.',
    alreadyEarned: false,
    stamp: null,
    createdAt: now,
    updatedAt: now,
    recheckUntil: null,
    retryAfterSeconds: null,
  }
  claims.set(claim.id, claim)
  return claim
}

export async function mockClaimStamp(
  driveId: string,
  { restAreaId }: StampClaimRequest,
): Promise<ApiResponse<StampClaim>> {
  const drive = findMockDrive(driveId)
  if (!drive) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '드라이브를 찾을 수 없어요.')
  if (drive.status !== 'ACTIVE' && drive.status !== 'PAUSED') {
    throw mockApiError(422, 'STAMP_LOCATION_NOT_VERIFIED', '주행 중에만 도장을 찍을 수 있어요.')
  }
  const seed = findSeed(restAreaId)
  const now = new Date().toISOString()
  const route = drive.routeId ? findMockRoute(drive.routeId) : null
  if (isDemoRoute(route) && distanceBetween(mockCurrentCoordinate(), seed.coordinate) > VISIT_RADIUS) {
    return { data: rejectedClaim(now), meta: createMeta() }
  }
  const alreadyEarned = earned.has(restAreaId)
  if (!alreadyEarned) earned.set(restAreaId, now)

  const claim: StampClaim = {
    id: `claim_mock_${++claimCount}`,
    status: 'VERIFIED',
    reason: null,
    alreadyEarned,
    stamp: { id: `stp_${restAreaId}`, restArea: toRestArea(seed), earnedAt: earned.get(restAreaId)!, firstDriveId: driveId },
    createdAt: now,
    updatedAt: now,
    recheckUntil: null,
    retryAfterSeconds: null,
  }
  claims.set(claim.id, claim)
  return { data: claim, meta: createMeta() }
}

export async function mockGetStampClaim(claimId: string): Promise<ApiResponse<StampClaim>> {
  const claim = claims.get(claimId)
  if (!claim) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '도장 요청을 찾을 수 없어요.')
  return { data: claim, meta: createMeta() }
}
