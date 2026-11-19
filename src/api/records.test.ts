import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// USE_MOCK은 모듈을 불러올 때 정해지므로, 백엔드 주소를 넣은 뒤 모듈을 새로 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./records')
}

const EMPTY = { data: { totalCount: 0, markers: [], nextCursor: null, hasMore: false }, meta: { requestId: 'req', serverTime: '' } }

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(EMPTY), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const requestedUrl = () => new URL(fetchMock.mock.calls[0][0] as string)

describe('fetchRecordMap', () => {
  it('조건 없이 부르면 GET /records/map 만 요청한다', async () => {
    const { fetchRecordMap } = await loadWithBackend()

    await fetchRecordMap()

    expect(requestedUrl().pathname).toBe('/api/v1/records/map')
    expect(requestedUrl().search).toBe('')
  })

  it('화면 범위는 서경,남위,동경,북위 순서의 bbox로 보낸다', async () => {
    const { fetchRecordMap } = await loadWithBackend()

    await fetchRecordMap({ bounds: { west: 126, south: 33, east: 130, north: 39 } })

    expect(requestedUrl().searchParams.get('bbox')).toBe('126,33,130,39')
  })

  it('검색어 · 날짜 · 커서 · 개수를 쿼리로 보낸다', async () => {
    const { fetchRecordMap } = await loadWithBackend()

    await fetchRecordMap({ q: '바다', date: '2026-11-02', cursor: 'cursor_2', limit: 100 })

    const params = requestedUrl().searchParams
    expect(params.get('q')).toBe('바다')
    expect(params.get('date')).toBe('2026-11-02')
    expect(params.get('cursor')).toBe('cursor_2')
    expect(params.get('limit')).toBe('100')
  })

  it('백엔드 주소가 없으면 목 응답을 돌려준다', async () => {
    vi.resetModules()
    const { fetchRecordMap } = await import('./records')

    const { data } = await fetchRecordMap()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(data.markers.length).toBeGreaterThan(0)
  })
})

describe('fetchRecords', () => {
  it('검색어 · 날짜 · 커서를 쿼리로 보내 GET /records 를 요청한다', async () => {
    const { fetchRecords } = await loadWithBackend()

    await fetchRecords({ q: '바다', date: '2026-11-03', cursor: 'cursor_2', limit: 20 })

    expect(requestedUrl().pathname).toBe('/api/v1/records')
    const params = requestedUrl().searchParams
    expect(params.get('q')).toBe('바다')
    expect(params.get('date')).toBe('2026-11-03')
    expect(params.get('cursor')).toBe('cursor_2')
    expect(params.get('limit')).toBe('20')
  })

  it('백엔드 주소가 없으면 최신순 목 기록과 전체 · 조건 개수를 돌려준다', async () => {
    vi.resetModules()
    const { fetchRecords } = await import('./records')

    const { data } = await fetchRecords({ q: '오이도' })

    expect(data.totalCount).toBe(12)
    expect(data.filteredCount).toBe(2)
    expect(data.items.every((item) => item.destination?.name === '시흥 오이도')).toBe(true)
    expect(data.items[0].driveDate >= data.items[1].driveDate).toBe(true)
  })
})

describe('fetchRecordCalendar', () => {
  it('달을 쿼리로 보내 GET /records/calendar 를 요청한다', async () => {
    const { fetchRecordCalendar } = await loadWithBackend()

    await fetchRecordCalendar('2026-10')

    expect(requestedUrl().pathname).toBe('/api/v1/records/calendar')
    expect(requestedUrl().searchParams.get('month')).toBe('2026-10')
  })

  it('백엔드 주소가 없으면 그 달에 기록이 있는 날짜와 개수만 날짜순으로 돌려준다', async () => {
    vi.resetModules()
    const { fetchRecordCalendar } = await import('./records')

    const { data } = await fetchRecordCalendar('2026-09')

    expect(data.month).toBe('2026-09')
    expect(data.days).toEqual([
      { date: '2026-09-06', count: 1 },
      { date: '2026-09-13', count: 1 },
      { date: '2026-09-20', count: 1 },
      { date: '2026-09-27', count: 1 },
    ])
  })
})

describe('fetchRecordGroup', () => {
  const card = (cardId: string, placeId: string | null, latitude = 37.3, longitude = 126.6) => ({
    cardId,
    driveId: `drv_${cardId}`,
    title: cardId,
    driveDate: '2026-11-01',
    destination: { placeId, name: '오이도', address: null, coordinate: { latitude, longitude } },
    thumbnailUrl: null,
    distanceMeters: 0,
    activeDurationSeconds: 0,
    completedAt: '2026-11-01T00:00:00Z',
  })
  const page = (items: unknown[], nextCursor: string | null) =>
    new Response(JSON.stringify({ data: { totalCount: 9, filteredCount: 9, items, nextCursor, hasMore: !!nextCursor }, meta: {} }))

  it('기록 목록을 넘겨 가며 같은 마커(groupKey)의 카드만 최신순으로 모은다', async () => {
    fetchMock
      .mockResolvedValueOnce(page([card('crd_a', 'plc_oido'), card('crd_x', 'plc_other')], 'c1'))
      .mockResolvedValueOnce(page([card('crd_b', 'plc_oido'), card('crd_c', 'plc_oido')], null))
    const { fetchRecordGroup } = await loadWithBackend()
    const marker = { groupKey: 'place:plc_oido', coordinate: { latitude: 37.3, longitude: 126.6 }, latestCard: card('crd_a', 'plc_oido'), recordCount: 3 }

    const cards = await fetchRecordGroup(marker, { q: '바다', date: '2026-11-01' })

    expect(cards.map((item) => item.cardId)).toEqual(['crd_a', 'crd_b', 'crd_c'])
    const first = new URL(fetchMock.mock.calls[0][0] as string)
    expect(first.pathname).toBe('/api/v1/records')
    expect(Object.fromEntries(first.searchParams)).toEqual({ q: '바다', date: '2026-11-01', limit: '100' })
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('cursor')).toBe('c1')
  })

  it('마커의 기록 수만큼 모이면 더 부르지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(page([card('crd_a', null, 37.123454, 126.5), card('crd_b', null, 37.123451, 126.5)], 'c1'))
    const { fetchRecordGroup } = await loadWithBackend()
    const marker = { groupKey: 'coord:37.12345,126.50000', coordinate: { latitude: 37.12345, longitude: 126.5 }, latestCard: card('crd_a', null, 37.123454, 126.5), recordCount: 2 }

    const cards = await fetchRecordGroup(marker, {})

    expect(cards.map((item) => item.cardId)).toEqual(['crd_a', 'crd_b'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
