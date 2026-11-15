import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { login } from '@/api/auth'
import { resetMockCouple } from '@/mocks/couples'
import useAuth from './useAuth'

// 목 서버는 처음에 가입을 마친 민준으로 로그인돼 있다
beforeEach(() => {
  resetMockCouple()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('저장된 세션이 있으면 로그인 상태로 시작하고 내 계정을 불러온다', async () => {
  const { result } = renderHook(() => useAuth())

  expect(result.current.status).toBe('signedIn')
  await waitFor(() => expect(result.current.user?.nickname).toBe('민준'))
})

it('로그아웃하면 로그아웃 상태가 되고, 다시 로그인하면 새 계정으로 바뀐다', async () => {
  const { result } = renderHook(() => useAuth())
  await waitFor(() => expect(result.current.user).not.toBeNull())

  await act(() => result.current.signOut())
  expect(result.current).toMatchObject({ status: 'signedOut', user: null })

  const loggedIn = await login('KAKAO')
  act(() => result.current.signIn(loggedIn!.user))
  expect(result.current.status).toBe('signedIn')
  expect(result.current.user?.onboardingCompleted).toBe(false)
})

it('쓰는 중에 리프레시 토큰까지 만료되면 로그아웃 상태가 된다', async () => {
  // 토큰 갱신은 실서버에서만 일어나므로 백엔드 주소를 넣고 모듈을 새로 불러온다
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  const { default: useBackendAuth } = await import('./useAuth')
  const { apiFetch } = await import('@/api/client')
  localStorage.setItem('bbus.auth', JSON.stringify({ accessToken: 'a', refreshToken: 'r' }))
  const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.endsWith('/me')) return json(200, { data: { id: 'usr_01', nickname: '민준', onboardingCompleted: true }, meta: {} })
      const code = url.endsWith('/auth/refresh') ? 'REFRESH_TOKEN_EXPIRED' : 'ACCESS_TOKEN_EXPIRED'
      return json(401, { error: { code, message: '', details: [], retryable: false }, meta: {} })
    }),
  )

  const { result } = renderHook(() => useBackendAuth())
  await waitFor(() => expect(result.current.user?.nickname).toBe('민준'))

  await act(() => apiFetch('/notifications').catch(() => undefined))
  expect(result.current).toMatchObject({ status: 'signedOut', user: null })
  expect(localStorage.getItem('bbus.auth')).toBeNull()
})
