import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockPlaces } from '@/mocks/places'

async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./places')
}

async function loadWithMock() {
  vi.resetModules()
  return import('./places')
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  resetMockPlaces()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchRecommendations', () => {
  it('카테고리와 좌표를 담아 GET /places/recommendations 를 요청한다', async () => {
    const { fetchRecommendations } = await loadWithBackend()

    await fetchRecommendations('NIGHT_VIEW', { latitude: 37.5, longitude: 127 })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/api/v1/places/recommendations')
    expect(Object.fromEntries(url.searchParams)).toEqual({ category: 'NIGHT_VIEW', latitude: '37.5', longitude: '127' })
  })

  it('좌표가 없으면 카테고리만 보낸다', async () => {
    const { fetchRecommendations } = await loadWithBackend()

    await fetchRecommendations('SEA')

    expect(new URL(fetchMock.mock.calls[0][0] as string).search).toBe('?category=SEA')
  })

  it('백엔드가 없으면 백엔드 카탈로그와 같은 id의 바다 목 장소를 돌려준다', async () => {
    const { fetchRecommendations } = await loadWithMock()

    const { data } = await fetchRecommendations('SEA')

    expect(data.category).toBe('SEA')
    expect(data.items.map((place) => place.id)).toEqual(['plc_daecheon', 'plc_oido', 'plc_heonhwaro', 'plc_eurwangni'])
  })

  it('목 서버에서 찜을 바꾸면 추천 목록에도 반영된다', async () => {
    const { fetchRecommendations, setPlaceFavorite } = await loadWithMock()

    await setPlaceFavorite('plc_heonhwaro', true)

    const { data } = await fetchRecommendations('SEA')
    expect(data.items.find((place) => place.id === 'plc_heonhwaro')?.isFavorite).toBe(true)
  })
})
