import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockRecordDeletions } from '@/mocks/records'

// USE_MOCK은 모듈을 불러올 때 정해지므로, 백엔드 주소를 넣은 뒤 모듈을 새로 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./cards')
}

async function loadWithMock() {
  vi.resetModules()
  return import('./cards')
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  resetMockRecordDeletions()
})

describe('fetchCard', () => {
  it('GET /cards/{cardId} 를 요청한다', async () => {
    const { fetchCard } = await loadWithBackend()

    await fetchCard('crd_01')

    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe('/api/v1/cards/crd_01')
  })

  it('백엔드 주소가 없으면 기록 목록과 같은 내용의 목 카드를 돌려준다', async () => {
    const { fetchCard } = await loadWithMock()

    const { data } = await fetchCard('crd_02')

    expect(data).toMatchObject({ id: 'crd_02', status: 'COMPLETED', canDelete: true })
    expect(data.destination?.name).toBe('시흥 오이도')
    expect(data.photos.length).toBeGreaterThan(0)
  })

  it('목 카드가 없으면 RESOURCE_NOT_FOUND 오류를 던진다', async () => {
    const { fetchCard } = await loadWithMock()

    await expect(fetchCard('crd_none')).rejects.toMatchObject({ status: 404, code: 'RESOURCE_NOT_FOUND' })
  })
})

describe('deleteCard', () => {
  it('커플 id와 카드 버전을 헤더에 담아 DELETE /cards/{cardId} 를 요청한다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { deleteCard } = await loadWithBackend()

    await deleteCard({ id: 'crd_01', coupleId: 'cpl_01', version: 3 })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/cards/crd_01')
    expect(init.method).toBe('DELETE')
    const headers = new Headers(init.headers)
    expect(headers.get('X-Couple-Id')).toBe('cpl_01')
    expect(headers.get('X-Expected-Version')).toBe('3')
  })

  it('목 서버에서 지우면 기록 목록에서도 빠진다', async () => {
    const { deleteCard } = await loadWithMock()
    const { fetchRecords } = await import('./records')

    await deleteCard({ id: 'crd_02', coupleId: 'cpl_mock', version: 1 })

    const { data } = await fetchRecords()
    expect(data.totalCount).toBe(11)
    expect(data.items.some((item) => item.cardId === 'crd_02')).toBe(false)
  })
})
