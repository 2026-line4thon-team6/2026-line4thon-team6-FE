import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockCouple } from '@/mocks/couples'
import {
  completeReauth,
  completeSocialLogin,
  deleteAccount,
  login,
  logout,
  pendingAuthPurpose,
  restoreSession,
  startReauth,
  startSocialLogin,
  withdraw,
} from './auth'

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
    // 서버는 Idempotency-Key(16~128자)가 없으면 코드 교환을 400으로 거절한다
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('Idempotency-Key')?.length).toBeGreaterThanOrEqual(16)
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

// 회원 탈퇴: 카카오 본인 재인증(5분 증명) → DELETE /me (X-Reauth-Token). 백엔드 명세 deleteAccount · reauthenticate
describe('회원 탈퇴', () => {
  const json = (status: number, body: unknown) =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

  it('재인증을 시작하면 PKCE challenge를 보내고, 돌아오면 같은 verifier로 탈퇴용 증명을 받는다', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void init
      if (url.endsWith('/auth/reauth/authorizations')) {
        return json(201, { data: { authSessionId: 'auth_re', authorizationUrl: 'https://kauth.example/reauth', state: 'st_re', expiresAt: '' }, meta: {} })
      }
      return json(200, { data: { reauthToken: 'proof_01', expiresAt: '2026-11-17T10:05:00Z' }, meta: {} })
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = await startReauth('https://app.example/oauth/callback')
    expect(url).toBe('https://kauth.example/reauth')
    const [, startInit] = fetchMock.mock.calls[0]
    // 서버는 모르는 필드를 거절한다: purpose 없이 provider · redirectUri · codeChallenge만 보낸다
    const start = JSON.parse(String(startInit?.body))
    expect(Object.keys(start).sort()).toEqual(['codeChallenge', 'provider', 'redirectUri'])
    expect(start).toMatchObject({ provider: 'KAKAO', redirectUri: 'https://app.example/oauth/callback' })
    expect(new Headers(startInit?.headers).get('Idempotency-Key')?.length).toBeGreaterThanOrEqual(16)
    expect(pendingAuthPurpose()).toBe('REAUTH')

    const proof = await completeReauth({ code: 'oauth_code', state: 'st_re' })
    const [completeUrl, completeInit] = fetchMock.mock.calls[1]
    expect(completeUrl).toMatch(/\/auth\/reauth$/)
    expect(JSON.parse(String(completeInit?.body))).toMatchObject({ authSessionId: 'auth_re', authorizationCode: 'oauth_code', state: 'st_re' })
    expect(proof).toBe('proof_01')
    expect(pendingAuthPurpose()).toBeNull()
  })

  it('로그인으로 시작한 콜백은 LOGIN으로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(201, { data: { authSessionId: 'a', authorizationUrl: 'https://k', state: 's', expiresAt: '' }, meta: {} })))
    await startSocialLogin('KAKAO', 'https://app.example/oauth/callback')

    expect(pendingAuthPurpose()).toBe('LOGIN')
  })

  it('탈퇴하면 증명을 X-Reauth-Token에 담아 DELETE /me 하고, 기기의 토큰을 지운다', async () => {
    localStorage.setItem('bbus.auth', JSON.stringify({ accessToken: 'a', refreshToken: 'r' }))
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void url
      void init
      return json(204, null)
    })
    vi.stubGlobal('fetch', fetchMock)

    await deleteAccount('proof_01')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/me$/)
    expect(init?.method).toBe('DELETE')
    expect(new Headers(init?.headers).get('X-Reauth-Token')).toBe('proof_01')
    expect(localStorage.getItem('bbus.auth')).toBeNull()
  })

  it('목 서버에서는 본인 확인 없이 바로 탈퇴되고 세션이 없어진다', async () => {
    await login('KAKAO')

    expect(await withdraw('https://app.example/oauth/callback')).toBe('withdrawn')
    expect(localStorage.getItem('bbus.auth')).toBeNull()
    expect(await restoreSession()).toBeNull()
  })
})
