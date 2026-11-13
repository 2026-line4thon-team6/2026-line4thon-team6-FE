import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import WelcomePage from './WelcomePage'

// 기능명세서 'L2 환영 · 약관 동의' · Figma 484:13599
function Harness(props: { onNext?: () => void; onOpenDocument?: (type: 'TERMS' | 'PRIVACY') => void }) {
  const [agreed, setAgreed] = useState(false)
  return (
    <WelcomePage
      agreed={agreed}
      onAgreeChange={setAgreed}
      onNext={props.onNext ?? vi.fn()}
      onOpenDocument={props.onOpenDocument ?? vi.fn()}
    />
  )
}

it('환영 문구를 보여 주고, 필수 약관에 동의해야 다음으로 넘어갈 수 있다', async () => {
  const onNext = vi.fn()
  render(<Harness onNext={onNext} />)

  expect(screen.getByRole('heading', { name: '반가워요! 저는 붕붕이라고 해요.' })).toBeInTheDocument()
  const next = screen.getByRole('button', { name: '만나서 반가워!' })
  expect(next).toBeDisabled()

  await userEvent.click(screen.getByRole('checkbox', { name: /이용약관 및 개인정보 처리방침에 동의해요/ }))
  expect(next).toBeEnabled()

  await userEvent.click(next)
  expect(onNext).toHaveBeenCalled()
})

it('약관 문구를 누르면 문서를 연다', async () => {
  const onOpenDocument = vi.fn()
  render(<Harness onOpenDocument={onOpenDocument} />)

  await userEvent.click(screen.getByRole('button', { name: '이용약관 보기' }))
  await userEvent.click(screen.getByRole('button', { name: '개인정보 처리방침 보기' }))

  expect(onOpenDocument.mock.calls).toEqual([['TERMS'], ['PRIVACY']])
})
