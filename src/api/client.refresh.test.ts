import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 액세스 토큰 갱신은 실서버에서만 일어나므로 백엔드 주소를 넣고 모듈을 새로 불러온다.
// 갱신 방법(저장된 리프레시 토큰으로 POST /auth/refresh)은 auth 모듈이 등록하므로 함께 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  const auth = await import('./auth')
  const client = await import('./client')
  return { ...auth, ...client }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const expired = () =>
  json(401, { error: { code: 'ACCESS_TOKEN_EXPIRED', message: '액세스 토큰이 만료되었습니다.', details: [], retryable: false }, meta: {} })

const refreshed = (accessToken: string, refreshToken: string) =>
  json(200, {
    data: { accessToken, accessTokenExpiresInSeconds: 1800, refreshToken, refreshTokenExpiresInSeconds: 1209600, tokenType: 'Bearer' },
    meta: {},
  })

const errorOf = (status: number, code: string) =>
  json(status, { error: { code, message: '', details: [], retryable: status >= 500 }, meta: {} })

const pathOf = (call: unknown[]) => new URL(call[0] as string).pathname
const authOf = (call: unknown[]) => new Headers((call[1] as RequestInit).headers).get('Authorization')

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('bbus.auth', JSON.stringify({ accessToken: 'old_access', refreshToken: 'old_refresh' }))
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('액세스 토큰 자동 갱신', () => {
  it('401을 받으면 리프레시 토큰으로 갱신하고, 새 토큰으로 원래 요청을 한 번 다시 보낸다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: { ok: true }, meta: {} }) : expired())
    })
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    const { data } = await apiFetch<{ ok: boolean }>('/notifications')

    expect(data.ok).toBe(true)
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/notifications', '/api/v1/auth/refresh', '/api/v1/notifications'])
    const refreshCall = fetchMock.mock.calls[1][1] as RequestInit
    expect(JSON.parse(String(refreshCall.body))).toEqual({ refreshToken: 'old_refresh' })
    expect(new Headers(refreshCall.headers).get('Idempotency-Key')?.length).toBeGreaterThanOrEqual(16)
    expect(authOf(fetchMock.mock.calls[2])).toBe('Bearer new_access')
    // 서버가 리프레시 토큰을 회전시키므로 새 리프레시 토큰도 같은 형식으로 저장한다
    expect(JSON.parse(localStorage.getItem('bbus.auth') ?? '{}')).toEqual({ accessToken: 'new_access', refreshToken: 'new_refresh' })
  })

  it('여러 요청이 동시에 401을 받아도 갱신은 한 번만 한다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: url, meta: {} }) : expired())
    })
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    const results = await Promise.all([apiFetch('/me'), apiFetch('/notifications'), apiFetch('/records')])

    expect(results).toHaveLength(3)
    expect(fetchMock.mock.calls.map(pathOf).filter((path) => path === '/api/v1/auth/refresh')).toHaveLength(1)
  })

  it('갱신이 실패하면 저장된 세션을 지우고 세션 만료를 알리며, 원래 오류를 던진다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('/auth/refresh')
          ? json(401, { error: { code: 'REFRESH_TOKEN_EXPIRED', message: '', details: [], retryable: false }, meta: {} })
          : expired(),
      ),
    )
    const { apiFetch, setAccessToken, onSessionExpired } = await loadWithBackend()
    setAccessToken('old_access')
    const listener = vi.fn()
    onSessionExpired(listener)

    await expect(apiFetch('/notifications')).rejects.toMatchObject({ status: 401, code: 'ACCESS_TOKEN_EXPIRED' })
    expect(localStorage.getItem('bbus.auth')).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    // 갱신에 실패한 요청은 다시 보내지 않는다
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/notifications', '/api/v1/auth/refresh'])
  })

  it('네트워크 오류로 갱신하지 못하면 세션은 그대로 두고 원래 오류를 던진다', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('/auth/refresh') ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(expired()),
    )
    const { apiFetch, setAccessToken, onSessionExpired } = await loadWithBackend()
    setAccessToken('old_access')
    const listener = vi.fn()
    onSessionExpired(listener)

    await expect(apiFetch('/notifications')).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('bbus.auth')).not.toBeNull()
    expect(listener).not.toHaveBeenCalled()
  })

  it('인증 엔드포인트 자체의 401은 갱신하지 않는다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(expired()))
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    for (const path of ['/auth/refresh', '/auth/token', '/auth/authorizations', '/auth/logout']) {
      await expect(apiFetch(path, { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 401 })
    }
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('만료 토큰에 AUTHENTICATION_REQUIRED를 주는 경로도 갱신한다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: {}, meta: {} }) : errorOf(401, 'AUTHENTICATION_REQUIRED'))
    })
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    await apiFetch('/home')
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/home', '/api/v1/auth/refresh', '/api/v1/home'])
  })

  it('재인증 요청(/auth/reauth)이 만료 토큰으로 401을 받으면 갱신한다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: {}, meta: {} }) : expired())
    })
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    await apiFetch('/auth/reauth/authorizations', { method: 'POST', body: '{}' })
    expect(fetchMock.mock.calls.map(pathOf)).toEqual([
      '/api/v1/auth/reauth/authorizations',
      '/api/v1/auth/refresh',
      '/api/v1/auth/reauth/authorizations',
    ])
  })

  it('같은 리프레시 토큰으로 다시 갱신하면 같은 Idempotency-Key를 보내 서버가 앞선 결과를 돌려주게 한다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/auth/refresh') ? errorOf(503, 'SERVICE_UNAVAILABLE') : expired()),
    )
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    await expect(apiFetch('/notifications')).rejects.toMatchObject({ status: 401 })
    await expect(apiFetch('/notifications')).rejects.toMatchObject({ status: 401 })

    const keys = fetchMock.mock.calls
      .filter((call) => pathOf(call) === '/api/v1/auth/refresh')
      .map((call) => new Headers((call[1] as RequestInit).headers).get('Idempotency-Key'))
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
    expect(keys[0]!.length).toBeLessThanOrEqual(128)
  })

  it('재인증이 필요하다는 401(REAUTH_REQUIRED)은 갱신하지 않는다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(errorOf(401, 'REAUTH_REQUIRED')))
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    await expect(apiFetch('/me', { method: 'DELETE' })).rejects.toMatchObject({ code: 'REAUTH_REQUIRED' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('갱신이 일시 장애(503)로 실패하면 세션은 그대로 두고 원래 오류를 던진다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/auth/refresh') ? errorOf(503, 'SERVICE_UNAVAILABLE') : expired()),
    )
    const { apiFetch, setAccessToken, onSessionExpired } = await loadWithBackend()
    setAccessToken('old_access')
    const listener = vi.fn()
    onSessionExpired(listener)

    await expect(apiFetch('/notifications')).rejects.toMatchObject({ status: 401, code: 'ACCESS_TOKEN_EXPIRED' })
    expect(localStorage.getItem('bbus.auth')).not.toBeNull()
    expect(listener).not.toHaveBeenCalled()
  })

  it('다른 탭이 이미 토큰을 갱신했으면 저장된 새 토큰을 쓰고 갱신하지 않는다', async () => {
    // 이미 회전된 리프레시 토큰을 다시 쓰면 서버가 세션 전체를 끊는다(REFRESH_TOKEN_REUSED)
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer tab_access' ? json(200, { data: {}, meta: {} }) : expired())
    })
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')
    localStorage.setItem('bbus.auth', JSON.stringify({ accessToken: 'tab_access', refreshToken: 'tab_refresh' }))

    await apiFetch('/notifications')
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/notifications', '/api/v1/notifications'])
    expect(authOf(fetchMock.mock.calls[1])).toBe('Bearer tab_access')
  })

  it('로그아웃은 회전된 최신 리프레시 토큰을 보낸다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      if (url.endsWith('/auth/logout')) return Promise.resolve(new Response(null, { status: 204 }))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: {}, meta: {} }) : expired())
    })
    const { apiFetch, setAccessToken, logout } = await loadWithBackend()
    setAccessToken('old_access')
    await apiFetch('/notifications')

    await logout('logout-key-0123456789')
    const logoutCall = fetchMock.mock.calls.find((call) => pathOf(call) === '/api/v1/auth/logout')!
    expect(JSON.parse(String((logoutCall[1] as RequestInit).body))).toMatchObject({ refreshToken: 'new_refresh' })
  })

  it('토큰 없이 보낸 요청의 401은 갱신하지 않는다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(expired()))
    const { apiFetch } = await loadWithBackend()

    await expect(apiFetch('/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('다시 보낸 요청도 401이면 또 갱신하지 않고 오류를 던진다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/auth/refresh') ? refreshed('new_access', 'new_refresh') : expired()),
    )
    const { apiFetch, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    await expect(apiFetch('/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/me', '/api/v1/auth/refresh', '/api/v1/me'])
  })

  it('앱을 열 때 저장된 액세스 토큰이 만료됐으면 갱신해서 내 계정을 불러온다', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? json(200, { data: { nickname: '민준' }, meta: {} }) : expired())
    })
    const { restoreSession } = await loadWithBackend()

    expect((await restoreSession())?.nickname).toBe('민준')
  })

  it('앱을 열 때 리프레시 토큰까지 만료됐으면 세션을 지우고 null을 돌려준다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/auth/refresh') ? errorOf(401, 'REFRESH_TOKEN_REUSED') : expired()),
    )
    const { restoreSession } = await loadWithBackend()

    expect(await restoreSession()).toBeNull()
    expect(localStorage.getItem('bbus.auth')).toBeNull()
    expect(fetchMock.mock.calls.map(pathOf)).toEqual(['/api/v1/me', '/api/v1/auth/refresh'])
  })

  it('앱을 열 때 계정이 없으면(/me 404, 탈퇴 등) 세션을 지우고 null을 돌려준다', async () => {
    fetchMock.mockResolvedValue(errorOf(404, 'RESOURCE_NOT_FOUND'))
    const { restoreSession } = await loadWithBackend()

    expect(await restoreSession()).toBeNull()
    expect(localStorage.getItem('bbus.auth')).toBeNull()
  })

  it('앱을 열 때 갱신이 일시 장애로 실패하면 세션을 남겨 두고 오류를 던진다', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/auth/refresh') ? errorOf(503, 'SERVICE_UNAVAILABLE') : expired()),
    )
    const { restoreSession } = await loadWithBackend()

    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('bbus.auth')).not.toBeNull()
  })
})

describe('파일 받기 (fetchBlob)', () => {
  it('음성 파일이 액세스 토큰 만료로 401이면 갱신하고 새 토큰으로 다시 받는다', async () => {
    const audioUrl = 'https://api.test/api/v1/radio/episodes/rep_1/audio?expires=1&signature=s'
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(refreshed('new_access', 'new_refresh'))
      const token = new Headers(init?.headers).get('Authorization')
      return Promise.resolve(token === 'Bearer new_access' ? new Response('mp3', { status: 200 }) : expired())
    })
    const { fetchBlob, setAccessToken } = await loadWithBackend()
    setAccessToken('old_access')

    const blob = await fetchBlob(audioUrl)

    expect(blob.size).toBe(3)
    expect(fetchMock.mock.calls.map(pathOf)).toEqual([
      '/api/v1/radio/episodes/rep_1/audio',
      '/api/v1/auth/refresh',
      '/api/v1/radio/episodes/rep_1/audio',
    ])
  })
})

describe('목 모드에서 남은 세션', () => {
  it('실서버에서는 목 토큰(mock_)을 세션으로 보지 않고 지운다', async () => {
    localStorage.setItem('bbus.auth', JSON.stringify({ accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' }))
    const { hasStoredSession, restoreSession } = await loadWithBackend()

    expect(hasStoredSession()).toBe(false)
    expect(await restoreSession()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('bbus.auth')).toBeNull()
  })
})
