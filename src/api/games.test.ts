import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./games')
}

let fetchMock: ReturnType<typeof vi.fn>

const request = (index = 0) => {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit]
  return { path: new URL(url).pathname, method: init.method, headers: new Headers(init.headers) }
}

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('게임 API 헤더', () => {
  const options = { coupleId: 'cpl_01', idempotencyKey: 'game-key-00000001' }

  it('게임 생성, 힌트·정답 열기, 다음·완료·중단에 커플 id와 멱등 키를 보낸다', async () => {
    const games = await loadWithBackend()

    await games.createGameSession({ driveId: 'drv_01', type: 'NONSENSE' }, options)
    await games.revealGameHint('gms_01', 'q_01', options)
    await games.revealGameAnswer('gms_01', 'q_01', options)
    await games.nextGameQuestion('gms_01', 2, options)
    await games.completeGameSession('gms_01', 3, options)
    await games.abandonGameSession('gms_01', 4, options)

    expect(fetchMock.mock.calls.map((_, index) => request(index).path)).toEqual([
      '/api/v1/game-sessions',
      '/api/v1/game-sessions/gms_01/questions/q_01/hint',
      '/api/v1/game-sessions/gms_01/questions/q_01/answer',
      '/api/v1/game-sessions/gms_01/next',
      '/api/v1/game-sessions/gms_01/complete',
      '/api/v1/game-sessions/gms_01/abandon',
    ])
    for (const index of fetchMock.mock.calls.keys()) {
      const { method, headers } = request(index)
      expect(method).toBe('POST')
      expect(headers.get('X-Couple-Id')).toBe('cpl_01')
      expect(headers.get('Idempotency-Key')).toBe('game-key-00000001')
    }
  })

  it('응답 저장은 커플 id만 담아 PUT 한다', async () => {
    const { saveGameResponse } = await loadWithBackend()

    await saveGameResponse('gms_01', 'q_01', { type: 'BALANCE', choice: 'A' }, { coupleId: 'cpl_01' })

    const { path, method, headers } = request()
    expect(path).toBe('/api/v1/game-sessions/gms_01/questions/q_01/responses/me')
    expect(method).toBe('PUT')
    expect(headers.get('X-Couple-Id')).toBe('cpl_01')
    expect(headers.has('Idempotency-Key')).toBe(false)
  })
})
