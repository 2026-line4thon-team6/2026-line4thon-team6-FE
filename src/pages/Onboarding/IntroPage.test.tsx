import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import IntroPage from './IntroPage'

// 기능명세서 'L3 호칭 질문' · Figma 484:13672
it('질문을 보여 주고, 나는... 버튼을 누르면 이름 입력으로 넘어간다', async () => {
  const onNext = vi.fn()
  render(<IntroPage onNext={onNext} />)

  expect(screen.getByRole('heading', { name: '제가 뭐라고 불러드릴까요?' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '나는...' }))
  expect(onNext).toHaveBeenCalled()
})
