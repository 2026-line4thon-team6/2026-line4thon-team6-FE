import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_CARD_DRIVE_ID, resetMockCards } from '@/mocks/cards'
import { resetMockCouple } from '@/mocks/couples'

async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./home')
}

async function loadWithMock() {
  vi.resetModules()
  return import('./home')
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  resetMockCouple()
  resetMockCards()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchHome', () => {
  it('좌표가 있으면 위도 · 경도를 함께 GET /home 으로 보낸다', async () => {
    const { fetchHome } = await loadWithBackend()

    await fetchHome({ latitude: 37.5, longitude: 127.03 })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/api/v1/home')
    expect(url.searchParams.get('latitude')).toBe('37.5')
    expect(url.searchParams.get('longitude')).toBe('127.03')
  })

  it('좌표가 없으면 쿼리 없이 요청한다', async () => {
    const { fetchHome } = await loadWithBackend()

    await fetchHome()

    expect(new URL(fetchMock.mock.calls[0][0] as string).search).toBe('')
  })

  it('백엔드가 없으면 목 커플 · 미작성 카드로 같은 모양의 응답을 만든다', async () => {
    const { fetchHome } = await loadWithMock()

    const { data } = await fetchHome()

    expect(data.me.id).toBe('usr_minjun')
    expect(data.couple?.id).toBe('cpl_01')
    expect(data.mascotName).toBe('붕붕이')
    expect(data.pendingCards.map((card) => card.driveId)).toEqual([MOCK_CARD_DRIVE_ID])
    expect(data.context.weather).toBe('맑음')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
