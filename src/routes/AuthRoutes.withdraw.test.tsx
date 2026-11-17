import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { ApiError } from '@/api/client'
import type { Auth } from '@/hooks/useAuth'
import { OAuthCallbackRoute } from './AuthRoutes'

vi.mock('@/api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/auth')>()),
  pendingAuthPurpose: vi.fn(),
  clearPendingAuth: vi.fn(),
  completeReauth: vi.fn(),
  deleteAccount: vi.fn(),
  completeSocialLogin: vi.fn(),
}))

const auth = { status: 'signedIn', user: null, signIn: vi.fn(), signOut: vi.fn().mockResolvedValue(undefined) } as unknown as Auth

// 다음 화면이 넘겨받은 안내 문구를 그대로 보여 주는 자리
function Landing({ name }: { name: string }) {
  const state = useLocation().state as { notice?: string; withdrawError?: string } | null
  return <p>{`${name}: ${state?.notice ?? state?.withdrawError ?? ''}`}</p>
}

function renderCallback(search: string) {
  render(
    <MemoryRouter initialEntries={['/oauth/callback' + search]}>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallbackRoute auth={auth} />} />
        <Route path="/login" element={<Landing name="로그인" />} />
        <Route path="/my" element={<Landing name="마이" />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authApi.pendingAuthPurpose).mockReturnValue('REAUTH')
})

// 카카오 본인 재인증에서 돌아오면 로그인이 아니라 탈퇴를 마무리한다 (같은 /oauth/callback 주소)
describe('회원 탈퇴 재인증 콜백', () => {
  it('증명을 받아 탈퇴하고, 로그아웃한 뒤 로그인 화면에서 완료를 알린다', async () => {
    vi.mocked(authApi.completeReauth).mockResolvedValue('proof_01')
    vi.mocked(authApi.deleteAccount).mockResolvedValue()

    renderCallback('?code=c&state=s')

    expect(await screen.findByText(/^로그인: 탈퇴가 완료됐어요/)).toBeInTheDocument()
    expect(authApi.completeReauth).toHaveBeenCalledWith({ code: 'c', state: 's' })
    expect(authApi.deleteAccount).toHaveBeenCalledWith('proof_01')
    expect(auth.signOut).toHaveBeenCalled()
    expect(authApi.completeSocialLogin).not.toHaveBeenCalled()
  })

  it('탈퇴하지 못하면 마이로 돌아가 이유를 알린다', async () => {
    vi.mocked(authApi.completeReauth).mockResolvedValue('proof_01')
    vi.mocked(authApi.deleteAccount).mockRejectedValue(new ApiError(503, { error: { code: 'SERVICE_UNAVAILABLE', message: '', details: [], retryable: true } }))

    renderCallback('?code=c&state=s')

    expect(await screen.findByText('마이: 지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('카카오 화면에서 취소하고 돌아오면 다녀오던 세션을 버리고 마이로 돌아간다', async () => {
    renderCallback('?error=access_denied')

    expect(await screen.findByText('마이: 본인 확인을 취소해서 탈퇴하지 않았어요.')).toBeInTheDocument()
    await waitFor(() => expect(authApi.clearPendingAuth).toHaveBeenCalled())
    expect(authApi.completeReauth).not.toHaveBeenCalled()
  })
})
