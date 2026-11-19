import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// USE_MOCK은 모듈을 불러올 때 정해지므로, 백엔드 주소를 넣은 뒤 모듈을 새로 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./push')
}

const SUBSCRIPTION = {
  endpoint: 'https://push.example.test/abc',
  expirationTime: null,
  keys: { p256dh: 'BKey', auth: 'Auth' },
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.setItem('bbus.device', JSON.stringify('dev_test'))
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { accepted: true }, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('registerWebPush', () => {
  it('이 기기의 PushSubscription JSON을 WEB 토큰으로 PUT /devices/{deviceId}/push-token 에 보낸다', async () => {
    const { registerWebPush } = await loadWithBackend()

    await registerWebPush({ toJSON: () => SUBSCRIPTION } as unknown as PushSubscription)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/devices/dev_test/push-token')
    expect(init.method).toBe('PUT')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({ token: JSON.stringify(SUBSCRIPTION), platform: 'WEB', enabled: true })
  })
})

describe('unregisterWebPush', () => {
  it('DELETE /devices/{deviceId}/push-token 을 보낸다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { unregisterWebPush } = await loadWithBackend()

    await unregisterWebPush()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/devices/dev_test/push-token')
    expect(init.method).toBe('DELETE')
  })
})
