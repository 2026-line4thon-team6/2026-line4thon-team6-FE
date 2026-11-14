import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockCouple } from '@/mocks/couples'
import { completeSocialLogin, login, logout, restoreSession, startSocialLogin } from './auth'

// 목 서버(VITE_API_BASE_URL 없음) 기준. 실제 OAuth 콜백 교환은 fetch를 바꿔 끼워 확인한다
beforeEach(() => {
  resetMockCouple()
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('로그인 세션', () => {
  it('로그인하면 토큰을 기기에 저장하고, 앱을 다시 열면 저장된 세션으로 내 계정을 불러온다', async () => {
    const result = await login('KAKAO')

    expect(result?.user.nickname).toBe('민준')
    expect(JSON.parse(localStorage.getItem('bbus.auth') ?? '{}')).toMatchObject({ refreshToken: 'mock_refresh_token' })
    expect((await restoreSession())?.nickname).toBe('민준')
  })

  it('로그아웃하면 저장된 토큰을 지우고 세션이 없어진다', async () => {
    await login('KAKAO')
    await logout('logout-key')

    expect(localStorage.getItem('bbus.auth')).toBeNull()
    expect(await restoreSession()).toBeNull()
  })
})

describe('소셜 로그인 (실서버 OAuth · PKCE)', () => {
  const json = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

  it('인증을 시작하면 PKCE challenge를 보내고, 콜백에서 같은 verifier로 코드를 교환한다', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void init
      if (url.endsWith('/auth/authorizations')) {
        return json(201, {
          data: { authSessionId: 'auth_01', authorizationUrl: 'https://kauth.example/authorize', state: 'st_01', expiresAt: '' },
          meta: {},
        })
      }
      return json(200, { data: { accessToken: 'a', refreshToken: 'r', user: { nickname: '' }, isNewUser: true }, meta: {} })
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = await startSocialLogin('KAKAO', 'https://app.example/oauth/callback')
    expect(url).toBe('https://kauth.example/authorize')
    const start = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(start).toMatchObject({ provider: 'KAKAO', purpose: 'LOGIN', redirectUri: 'https://app.example/oauth/callback' })
    expect(start.codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/)

    const result = await completeSocialLogin({ code: 'oauth_code', state: 'st_01' })
    const exchange = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
    expect(exchange).toMatchObject({ authSessionId: 'auth_01', authorizationCode: 'oauth_code', state: 'st_01' })
    expect(exchange.codeVerifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/)
    expect(result.isNewUser).toBe(true)
    expect(JSON.parse(localStorage.getItem('bbus.auth') ?? '{}')).toMatchObject({ accessToken: 'a', refreshToken: 'r' })
  })

  it('콜백의 state가 시작할 때와 다르면 코드를 교환하지 않는다', async () => {
    const fetchMock = vi.fn(() =>
      json(201, { data: { authSessionId: 'auth_01', authorizationUrl: 'https://k', state: 'st_01', expiresAt: '' }, meta: {} }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await startSocialLogin('KAKAO', 'https://app.example/oauth/callback')

    await expect(completeSocialLogin({ code: 'c', state: 'other' })).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
