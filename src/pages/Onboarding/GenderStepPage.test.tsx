import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import type { Gender } from './GenderStepPage'
import GenderStepPage from './GenderStepPage'

// 기능명세서 'L6 성별 선택' · Figma 484:13963
function Harness({ onNext = vi.fn(), onBack = vi.fn() }: { onNext?: (gender: Gender) => void; onBack?: () => void }) {
  const [value, setValue] = useState<Gender | null>(null)
  return <GenderStepPage value={value} onChange={setValue} onBack={onBack} onNext={onNext} />
}

it('남자 · 여자 중 하나를 고르면 다음으로 넘어갈 수 있다', async () => {
  const onNext = vi.fn()
  render(<Harness onNext={onNext} />)

  expect(screen.getByRole('heading', { level: 1, name: '성별 선택' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: '성별을 선택해주세요.' })).toBeInTheDocument()
  const next = screen.getByRole('button', { name: '다음' })
  expect(next).toBeDisabled()

  await userEvent.click(screen.getByRole('radio', { name: '여자' }))
  expect(screen.getByRole('radio', { name: '여자' })).toBeChecked()
  expect(screen.getByRole('radio', { name: '남자' })).not.toBeChecked()

  await userEvent.click(next)
  expect(onNext).toHaveBeenCalledWith('FEMALE')
})

it('뒤로가기를 누르면 이전 단계로 간다', async () => {
  const onBack = vi.fn()
  render(<Harness onBack={onBack} />)

  await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(onBack).toHaveBeenCalled()
})
