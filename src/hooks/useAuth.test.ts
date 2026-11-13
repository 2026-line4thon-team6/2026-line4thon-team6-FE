import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { login } from '@/api/auth'
import { resetMockCouple } from '@/mocks/couples'
import useAuth from './useAuth'

// 목 서버는 처음에 가입을 마친 민준으로 로그인돼 있다
beforeEach(() => {
  resetMockCouple()
  localStorage.clear()
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
