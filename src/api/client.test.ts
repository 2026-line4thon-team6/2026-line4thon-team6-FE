import { afterEach, describe, expect, it, vi } from 'vitest'

// 모듈을 불러올 때 백엔드 주소를 읽으므로, 주소를 바꾼 뒤 새로 불러온다
async function load(baseUrl: string) {
  vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  vi.resetModules()
  return import('./client')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('detectBackend', () => {
  it('백엔드 주소가 없으면 서버를 확인하지 않고 목 데이터를 쓴다', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const client = await load('')

    await client.detectBackend()

    expect(client.USE_MOCK).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('서버가 응답하면 실서버를 쓴다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { status: 'UP' } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const client = await load('https://api.test/api/v1')

    await client.detectBackend()

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/v1/health')
    expect(client.USE_MOCK).toBe(false)
  })

  it('서버가 꺼져 있거나 오류를 주면 목 데이터로 바꾼다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const down = await load('https://api.test/api/v1')
    await down.detectBackend()
    expect(down.USE_MOCK).toBe(true)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 502 })))
    const broken = await load('https://api.test/api/v1')
    await broken.detectBackend()
    expect(broken.USE_MOCK).toBe(true)
  })

  it('응답이 너무 늦으면 기다리지 않고 목 데이터로 바꾼다', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')))),
      ),
    )
    const client = await load('https://api.test/api/v1')

    const pending = client.detectBackend()
    await vi.advanceTimersByTimeAsync(5000)
    await pending

    expect(client.USE_MOCK).toBe(true)
    vi.useRealTimers()
  })
})
