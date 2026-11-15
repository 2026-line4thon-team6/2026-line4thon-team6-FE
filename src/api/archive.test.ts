import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 보관함 3종(플레이리스트 · 라디오 사연 · 찜한 장소) 목록 API가 커서 페이지 파라미터를 붙여 요청하는지 확인한다.
// USE_MOCK은 모듈을 불러올 때 정해지므로, 백엔드 주소를 넣은 뒤 모듈을 새로 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  const [playlists, radio, places] = await Promise.all([import('./playlists'), import('./radio'), import('./places')])
  return { ...playlists, ...radio, ...places }
}

const EMPTY = {
  data: { items: [], nextCursor: null, hasMore: false, totalCount: 0 },
  meta: { requestId: 'req', serverTime: '' },
}

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

describe('fetchPlaylistLibrary', () => {
  it('첫 페이지는 파라미터 없이 GET /me/playlists', async () => {
    const { fetchPlaylistLibrary } = await loadWithBackend()

    await fetchPlaylistLibrary()

    expect(requestedUrl().pathname).toBe('/api/v1/me/playlists')
    expect(requestedUrl().search).toBe('')
  })

  it('다음 페이지는 cursor · limit를 붙인다', async () => {
    const { fetchPlaylistLibrary } = await loadWithBackend()

    await fetchPlaylistLibrary({ cursor: 'abc=', limit: 10 })

    expect(requestedUrl().searchParams.get('cursor')).toBe('abc=')
    expect(requestedUrl().searchParams.get('limit')).toBe('10')
  })
})

describe('fetchRadioHistory', () => {
  it('검색어가 없으면 q를 빼고 요청한다', async () => {
    const { fetchRadioHistory } = await loadWithBackend()

    await fetchRadioHistory('  ')

    expect(requestedUrl().pathname).toBe('/api/v1/radio/episodes')
    expect(requestedUrl().search).toBe('')
  })

  it('다음 페이지는 같은 검색어와 cursor를 함께 보낸다 (커서는 검색어에 묶여 있다)', async () => {
    const { fetchRadioHistory } = await loadWithBackend()

    await fetchRadioHistory(' 바다 ', { cursor: 'next' })

    expect(requestedUrl().searchParams.get('q')).toBe('바다')
    expect(requestedUrl().searchParams.get('cursor')).toBe('next')
  })
})

describe('fetchFavorites', () => {
  it('다음 페이지는 같은 카테고리와 cursor를 함께 보낸다 (커서는 카테고리에 묶여 있다)', async () => {
    const { fetchFavorites } = await loadWithBackend()

    await fetchFavorites('SEA', { cursor: 'next' })

    expect(requestedUrl().pathname).toBe('/api/v1/me/favorite-places')
    expect(requestedUrl().searchParams.get('category')).toBe('SEA')
    expect(requestedUrl().searchParams.get('cursor')).toBe('next')
  })

  it('카테고리를 생략하면 전체', async () => {
    const { fetchFavorites } = await loadWithBackend()

    await fetchFavorites()

    expect(requestedUrl().search).toBe('')
  })
})
