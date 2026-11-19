import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { claimStamp, getDriveRestAreas } from '@/api/restAreas'
import { createRoute } from '@/api/routes'
import { prepareDrive, startDrive } from '@/api/drives'
import type { Position } from '@/utils/location'
import { DEMO_POLYLINE, DEMO_STOP_REST_AREA_ID, mockWatchPosition, resetDemoDrive } from './demoDrive'
import { resetMockDrives } from './drives'
import { resetMockStamps } from './restAreas'
import { resetMockRoutes } from './routes'
import { ANMOK_BEACH, MOCK_CURRENT_COORDINATE } from './search'
import { distanceBetween } from './utils'

const options = { coupleId: 'cpl_01', idempotencyKey: 'test-idempotency-key-0201' }
const members = { driverUserId: 'usr_driver', passengerUserId: 'usr_passenger', recorderUserId: 'usr_passenger' }
const DAEGWALLYEONG = { latitude: 37.691, longitude: 128.773 }

async function startDemoDrive() {
  const { data: route } = await createRoute(
    {
      origin: { placeId: null, name: '내 위치', address: '', coordinate: MOCK_CURRENT_COORDINATE },
      destination: { placeId: null, name: '강릉 안목해변', address: '', coordinate: ANMOK_BEACH },
    },
    'test-idempotency-key-0202',
  )
  const { data: drive } = await prepareDrive({ ...members, routeId: route.id }, options)
  await startDrive(drive.id, { expectedVersion: drive.controlVersion, initialCoordinate: MOCK_CURRENT_COORDINATE }, options)
  return { route, driveId: drive.id }
}

beforeEach(() => {
  vi.useFakeTimers()
  resetMockDrives()
  resetMockRoutes()
  resetMockStamps()
  resetDemoDrive()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('시연용 안목해변 드라이브 목', () => {
  it('목적지가 안목해변이면 도로 모양 경로와 경로 위 휴게소를 준다', async () => {
    const { route, driveId } = await startDemoDrive()
    expect(route.polyline).toBe(DEMO_POLYLINE)

    const { data } = await getDriveRestAreas(driveId)
    expect(data.items.map((area) => area.name)).toEqual(['양평휴게소', '횡성휴게소', '평창휴게소', '강릉대관령휴게소'])
    expect(data.items.filter((area) => area.earned)).toHaveLength(3)
  })

  it('휴게소에 닿기 전에는 도장을 찍을 수 없고, 강릉대관령휴게소에서 도장을 찍을 때까지 멈췄다가 안목해변까지 간다', async () => {
    const { driveId } = await startDemoDrive()
    let position: Position | null = null
    const stop = mockWatchPosition((next) => {
      position = next
    })

    const { data: early } = await claimStamp(driveId, { restAreaId: DEMO_STOP_REST_AREA_ID, method: 'GPS' }, options)
    expect(early).toMatchObject({ status: 'REJECTED', stamp: null })

    await vi.advanceTimersByTimeAsync(120_000)
    expect(distanceBetween(position!.coordinate, DAEGWALLYEONG)).toBeLessThan(100)

    await claimStamp(driveId, { restAreaId: DEMO_STOP_REST_AREA_ID, method: 'GPS' }, options)
    await vi.advanceTimersByTimeAsync(180_000)
    expect(distanceBetween(position!.coordinate, ANMOK_BEACH)).toBeLessThan(500)
    stop()
  })
})
