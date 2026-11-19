import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockCards } from '@/mocks/cards'
import { resetDemoDrive } from '@/mocks/demoDrive'
import { resetMockDrives } from '@/mocks/drives'
import { resetMockStamps } from '@/mocks/restAreas'
import { resetMockRoutes } from '@/mocks/routes'
import { ANMOK_BEACH, MOCK_CURRENT_COORDINATE } from '@/mocks/search'
import type { Drive } from '@/types/drive'

// ?demo=1로 연 실서버 모드를 흉내 낸다. 실서버 요청은 apiFetch 가짜가 받는다
vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>()
  return {
    ...actual,
    DEMO: true,
    USE_MOCK: false,
    isDemoId: (id: string | null | undefined) => !!id && id.includes('_mock_'),
    apiFetch: vi.fn(),
  }
})

const { apiFetch } = await import('./client')
const { createRoute } = await import('./routes')
const { endDrive, getActiveDrive, startDrive, updateDrive } = await import('./drives')
const { createGameSession } = await import('./games')
const { fetchDriveCard } = await import('./cards')

const fetchMock = vi.mocked(apiFetch)
const options = { coupleId: 'cpl_real', idempotencyKey: 'test-idempotency-key-0301' }

const realDrive = (patch: Partial<Drive> = {}): Drive =>
  ({
    id: 'drv_real',
    coupleId: 'cpl_real',
    title: '바다 보러 가자',
    status: 'PREPARING',
    driverUserId: 'usr_partner',
    passengerUserId: 'usr_me',
    recorderUserId: 'usr_me',
    controlVersion: 1,
    ...patch,
  }) as Drive

const calls = () => fetchMock.mock.calls.map(([path, init]) => `${init?.method ?? 'GET'} ${path}`)

beforeEach(() => {
  resetMockDrives()
  resetMockRoutes()
  resetMockStamps()
  resetMockCards()
  resetDemoDrive()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (path, init) => {
    const method = init?.method ?? 'GET'
    const respond = (data: unknown) => ({ data, meta: { requestId: 'req', serverTime: '' } })
    if (path === '/routes') return respond({ id: 'rte_real' })
    if (path === '/drives/drv_real' && method === 'GET') return respond(realDrive({ controlVersion: 2 }))
    if (path === '/drives/drv_real' && method === 'PATCH') return respond(realDrive({ controlVersion: 2 }))
    if (path === '/drives/drv_real/start') return respond(realDrive({ status: 'ACTIVE', controlVersion: 3 }))
    if (path === '/drives/drv_real/card') return respond({ id: 'crd_real', coupleId: 'cpl_real', version: 1 })
    return respond({ id: 'job_real' })
  })
})

describe('시연(?demo=1): 안목해변 드라이브만 목으로 돌리기', () => {
  it('실서버 드라이브에 안목해변 경로를 정하면 목 드라이브로 바뀌고, 실서버 드라이브도 같이 출발해 콘텐츠는 실서버 드라이브로 요청한다', async () => {
    const { data: route } = await createRoute(
      {
        origin: { placeId: null, name: '내 위치', address: '', coordinate: MOCK_CURRENT_COORDINATE },
        destination: { placeId: 'plc_anmok', name: '강릉 안목해변', address: '', coordinate: ANMOK_BEACH },
      },
      'test-idempotency-key-0302',
    )
    expect(route.id).toMatch(/_mock_/)
    expect(calls()).toEqual([])

    const { data: drive } = await updateDrive('drv_real', { routeId: route.id, expectedVersion: 1 }, options)
    expect(drive).toMatchObject({ id: expect.stringMatching(/_mock_/), title: '바다 보러 가자', recorderUserId: 'usr_me' })
    expect(calls()).toEqual(['GET /drives/drv_real', 'POST /routes', 'PATCH /drives/drv_real'])
    expect((await getActiveDrive()).data.drive?.id).toBe(drive.id)

    await startDrive(drive.id, { expectedVersion: drive.controlVersion, initialCoordinate: MOCK_CURRENT_COORDINATE }, options)
    expect(calls()).toContain('POST /drives/drv_real/start')

    await createGameSession({ driveId: drive.id, type: 'BALANCE' }, options)
    const [, gameRequest] = fetchMock.mock.calls.at(-1)!
    expect(JSON.parse(gameRequest!.body as string)).toEqual({ driveId: 'drv_real', type: 'BALANCE' })

    const { data: ended } = await endDrive(
      drive.id,
      { expectedVersion: drive.controlVersion + 1, reason: 'USER_ENDED', lastRecordedSequence: 0 },
      options,
    )
    await vi.waitFor(() => expect(calls()).toContain('POST /cards/crd_real/discard'))
    expect(calls()).toContain('POST /drives/drv_real/end')

    const { data: card } = await fetchDriveCard(ended.id)
    expect(card).toMatchObject({ driveId: ended.id, coupleId: 'cpl_real', region: '강릉 안목해변' })
  })

  it('안목해변이 아닌 목적지는 평소처럼 실서버로 경로를 만든다', async () => {
    await createRoute(
      {
        origin: { placeId: null, name: '내 위치', address: '', coordinate: MOCK_CURRENT_COORDINATE },
        destination: { placeId: null, name: '반포', address: '', coordinate: { latitude: 37.5103, longitude: 126.9955 } },
      },
      'test-idempotency-key-0303',
    )
    expect(calls()).toEqual(['POST /routes'])
  })
})
