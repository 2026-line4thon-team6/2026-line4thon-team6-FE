import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { prepareDrive, startDrive, updateDrive } from '@/api/drives'
import { claimStamp, getRestArea, getStampBook } from '@/api/restAreas'
import { createRoute } from '@/api/routes'
import { resetMockDrives } from './drives'
import { resetMockStamps } from './restAreas'
import { resetMockRoutes } from './routes'
import { MOCK_CURRENT_COORDINATE } from './search'

const options = { coupleId: 'cpl_01', idempotencyKey: 'test-idempotency-key-0101' }
const members = { driverUserId: 'usr_driver', passengerUserId: 'usr_passenger', recorderUserId: 'usr_passenger' }

async function startMockDrive() {
  const { data: drive } = await prepareDrive(members, options)
  const { data: route } = await createRoute(
    {
      origin: { placeId: null, name: '내 위치', address: '서울 서초구 서초동', coordinate: MOCK_CURRENT_COORDINATE },
      destination: { placeId: null, name: '반포', address: '서울', coordinate: { latitude: 37.5103, longitude: 126.9955 } },
    },
    'test-idempotency-key-0102',
  )
  const { data: withRoute } = await updateDrive(drive.id, { routeId: route.id, expectedVersion: 1 }, options)
  await startDrive(drive.id, { expectedVersion: withRoute.controlVersion, initialCoordinate: MOCK_CURRENT_COORDINATE }, options)
  return drive.id
}

beforeEach(() => {
  resetMockDrives()
  resetMockRoutes()
  resetMockStamps()
})

describe('휴게소 · 스탬프 목 API', () => {
  it('도장판은 전체 휴게소와 찍은 수를 준다 (Figma 3 / 16)', async () => {
    const { data } = await getStampBook({ limit: 100 })

    expect(data).toMatchObject({ earnedCount: 3, catalogCount: 16, capacity: 16 })
    expect(data.items.filter((area) => area.earned)).toHaveLength(3)
  })

  it('주행 중에 도장을 찍으면 도장판에 반영되고, 같은 곳을 다시 찍으면 alreadyEarned', async () => {
    const driveId = await startMockDrive()

    const { data: claim } = await claimStamp(driveId, { restAreaId: 'rest_mock_4', method: 'MANUAL' }, options)
    expect(claim).toMatchObject({ status: 'VERIFIED', alreadyEarned: false })
    expect((await getStampBook()).data.earnedCount).toBe(4)

    const { data: again } = await claimStamp(driveId, { restAreaId: 'rest_mock_4', method: 'MANUAL' }, options)
    expect(again.alreadyEarned).toBe(true)
    expect((await getStampBook()).data.earnedCount).toBe(4)
  })

  it('주행 중이 아니면 도장을 찍을 수 없다', async () => {
    const { data: drive } = await prepareDrive(members, options)

    const error = await claimStamp(drive.id, { restAreaId: 'rest_mock_4', method: 'MANUAL' }, options).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('STAMP_LOCATION_NOT_VERIFIED')
  })

  it('휴게소 상세는 대표 메뉴를 최대 4개 주고, 메뉴 데이터가 없으면 detailsAvailable=false', async () => {
    const { data } = await getRestArea('rest_mock_1')
    expect(data.menus.length).toBeLessThanOrEqual(4)
    expect(data.detailsAvailable).toBe(true)

    const { data: empty } = await getRestArea('rest_mock_16')
    expect(empty).toMatchObject({ menus: [], detailsAvailable: false })
  })
})
