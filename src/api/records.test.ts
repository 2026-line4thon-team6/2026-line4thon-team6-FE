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
