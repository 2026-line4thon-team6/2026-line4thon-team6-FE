import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import {
  cancelPreparedDrive,
  endDrive,
  getActiveDrive,
  pauseDrive,
  prepareDrive,
  resumeDrive,
  startDrive,
  updateDrive,
} from '@/api/drives'
import { createRoute } from '@/api/routes'
import { deleteSearchHistory, getSearchHistory, saveSearchHistory, searchPlaces } from '@/api/search'
import type { RoutePoint } from '@/types/route'
import { DEFAULT_DRIVE_TITLE, resetMockDrives } from './drives'
import { resetMockRoutes } from './routes'
import { MOCK_CURRENT_COORDINATE, resetMockSearchHistory } from './search'

// 백엔드 주소가 없는 테스트 환경에서는 API 함수가 목 데이터로 응답한다
const options = { coupleId: 'cpl_01', idempotencyKey: 'test-idempotency-key-0001' }
const members = { driverUserId: 'usr_driver', passengerUserId: 'usr_passenger', recorderUserId: 'usr_passenger' }

const origin: RoutePoint = { placeId: null, name: '내 위치', address: '서울 서초구 서초동', coordinate: MOCK_CURRENT_COORDINATE }
const destination: RoutePoint = {
  placeId: 'plc_search_1',
  name: '서울 반포 한강공원',
  address: '서울 서초구 신반포로11길 40',
  coordinate: { latitude: 37.5103, longitude: 126.9955 },
}

const errorCode = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => (error instanceof ApiError ? error.code : 'NOT_API_ERROR'),
  )

beforeEach(() => {
  resetMockDrives()
  resetMockRoutes()
  resetMockSearchHistory()
})

describe('드라이브 목 API', () => {
  it('드라이브를 준비하면 PREPARING으로 만들고, 제목을 비우면 기본 제목을 쓴다', async () => {
    const { data } = await prepareDrive({ ...members, title: '  ' }, options)

    expect(data.status).toBe('PREPARING')
    expect(data.title).toBe(DEFAULT_DRIVE_TITLE)
    expect((await getActiveDrive()).data.drive?.id).toBe(data.id)
  })

  it('진행 중인 드라이브가 있으면 새로 준비할 수 없다', async () => {
    await prepareDrive(members, options)

    expect(await errorCode(prepareDrive(members, options))).toBe('CONFLICT')
  })

  it('드라이브명을 바꾸면 controlVersion이 오르고, 이전 버전으로 다시 바꾸면 VERSION_CONFLICT', async () => {
    const { data: drive } = await prepareDrive(members, options)
    const { data: renamed } = await updateDrive(drive.id, { title: '우리의 첫 바다 드라이브', expectedVersion: 1 }, options)

    expect(renamed.title).toBe('우리의 첫 바다 드라이브')
    expect(renamed.controlVersion).toBe(2)
    expect(await errorCode(updateDrive(drive.id, { title: '다시', expectedVersion: 1 }, options))).toBe(
      'VERSION_CONFLICT',
    )
  })

  it('경로를 연결해야 출발할 수 있고, 연결하면 출발지 · 목적지가 채워진다', async () => {
    const { data: drive } = await prepareDrive(members, options)
    const startBody = { expectedVersion: 1, initialCoordinate: MOCK_CURRENT_COORDINATE }
    expect(await errorCode(startDrive(drive.id, startBody, options))).toBe('VALIDATION_FAILED')

    const { data: route } = await createRoute({ origin, destination }, 'test-idempotency-key-0002')
    const { data: withRoute } = await updateDrive(drive.id, { routeId: route.id, expectedVersion: 1 }, options)
    expect(withRoute.destination?.name).toBe('서울 반포 한강공원')

    const { data: started } = await startDrive(
      drive.id,
      { expectedVersion: withRoute.controlVersion, initialCoordinate: MOCK_CURRENT_COORDINATE },
      options,
    )
    expect(started.status).toBe('ACTIVE')
    expect(started.startedAt).not.toBeNull()

    // 시작한 주행은 취소할 수 없다
    expect(await errorCode(cancelPreparedDrive(drive.id, { expectedVersion: started.controlVersion }, options))).toBe(
      'CONFLICT',
    )
  })

  it('주행을 일시중단 · 재개하고, 마치면 ENDED가 되어 카드를 만들 수 있다', async () => {
    const { data: drive } = await prepareDrive(members, options)
    const { data: route } = await createRoute({ origin, destination }, 'test-idempotency-key-0005')
    const { data: withRoute } = await updateDrive(drive.id, { routeId: route.id, expectedVersion: 1 }, options)
    const { data: started } = await startDrive(
      drive.id,
      { expectedVersion: withRoute.controlVersion, initialCoordinate: MOCK_CURRENT_COORDINATE },
      options,
    )

    const { data: paused } = await pauseDrive(drive.id, { expectedVersion: started.controlVersion }, options)
    expect(paused.status).toBe('PAUSED')
    expect(paused.pausedAt).not.toBeNull()
    expect(await errorCode(pauseDrive(drive.id, { expectedVersion: paused.controlVersion }, options))).toBe('CONFLICT')

    const { data: resumed } = await resumeDrive(drive.id, { expectedVersion: paused.controlVersion }, options)
    expect(resumed.status).toBe('ACTIVE')
    expect(resumed.pausedAt).toBeNull()

    const { data: ended } = await endDrive(
      drive.id,
      { expectedVersion: resumed.controlVersion, reason: 'USER_ENDED', lastRecordedSequence: 0 },
      options,
    )
    expect(ended).toMatchObject({ status: 'ENDED', endReason: 'USER_ENDED', canCreateCard: true })
    expect((await getActiveDrive()).data.drive).toBeNull()
  })

  it('준비 중인 드라이브는 마칠 수 없다', async () => {
    const { data: drive } = await prepareDrive(members, options)
    const body = { expectedVersion: 1, reason: 'USER_ENDED' as const, lastRecordedSequence: 0 }

    expect(await errorCode(endDrive(drive.id, body, options))).toBe('CONFLICT')
  })

  it('준비 중인 드라이브를 취소하면 진행 중인 드라이브가 없어진다', async () => {
    const { data: drive } = await prepareDrive(members, options)
    const { data: cancelled } = await cancelPreparedDrive(drive.id, { expectedVersion: 1 }, options)

    expect(cancelled.status).toBe('CANCELLED')
    expect((await getActiveDrive()).data.drive).toBeNull()
  })
})

describe('경로 목 API', () => {
  it('경유지는 3개까지만 받는다', async () => {
    const waypoints = Array.from({ length: 4 }, () => destination)

    expect(await errorCode(createRoute({ origin, destination, waypoints }, 'test-idempotency-key-0003'))).toBe(
      'VALIDATION_FAILED',
    )
  })
})

describe('검색 목 API', () => {
  it('공백을 무시하고 찾고, 위치를 보내면 가까운 순으로 거리와 함께 준다', async () => {
    const { data } = await searchPlaces({ q: '한강 공원', coordinate: MOCK_CURRENT_COORDINATE })

    expect(data.items.length).toBe(6)
    expect(data.items[0].name).toBe('서울 반포 한강공원')
    const distances = data.items.map((place) => place.distanceMeters ?? 0)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('최근 검색어는 같은 검색어를 맨 앞으로 옮기고, 삭제할 수 있다', async () => {
    await saveSearchHistory('강릉   헌화로', 'test-idempotency-key-0004')
    const { data: history } = await getSearchHistory()

    expect(history[0].query).toBe('강릉 헌화로')
    expect(history.filter((item) => item.query === '강릉 헌화로')).toHaveLength(1)

    await deleteSearchHistory(history[0].id)
    expect((await getSearchHistory()).data.some((item) => item.query === '강릉 헌화로')).toBe(false)
  })
})
