import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

// 기능명세서 'L1 로그인 메인' · Figma 'Onboarding_UI > 로그인'(484:13466). 로그인은 카카오만 (API 확정 정책 D09)
it('로고 · 소개 문구를 보여 주고, 카카오 버튼을 누르면 로그인을 시작한다', async () => {
  const onKakaoLogin = vi.fn()
  render(<LoginPage status="idle" error={null} onKakaoLogin={onKakaoLogin} />)

  expect(screen.getByRole('heading', { level: 1, name: '붕붕어스' })).toBeInTheDocument()
  expect(screen.getByText(/둘만의 드라이브를 더욱/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: '카카오로 3초 만에 시작하기' }))
  expect(onKakaoLogin).toHaveBeenCalled()
})

it('로그인하는 동안에는 버튼을 막는다', () => {
  render(<LoginPage status="loading" error={null} onKakaoLogin={vi.fn()} />)

  expect(screen.getByRole('button', { name: '로그인 중' })).toBeDisabled()
})

it('로그인에 실패하면 안내한다', () => {
  render(<LoginPage status="idle" error="로그인하지 못했어요. 다시 시도해 주세요." onKakaoLogin={vi.fn()} />)

  expect(screen.getByRole('alert')).toHaveTextContent('로그인하지 못했어요. 다시 시도해 주세요.')
})
