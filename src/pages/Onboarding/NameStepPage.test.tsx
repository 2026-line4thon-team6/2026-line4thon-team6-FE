import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import NameStepPage from './NameStepPage'

// 기능명세서 'L4 닉네임 입력' · 'L8 붕붕이 이름' (같은 화면 구성). Figma 484:13697 · 484:14207
type Props = ComponentProps<typeof NameStepPage>

function Harness(props: Partial<Props>) {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <NameStepPage
      title="이름 입력"
      question="제가 뭐라고 불러드릴까요?"
      label="닉네임"
      onBack={vi.fn()}
      onNext={vi.fn()}
      {...props}
      value={value}
      onChange={setValue}
    />
  )
}

describe('이름 입력 단계', () => {
  it('제목 · 질문을 보여 주고, 들어오면 입력칸에 커서가 간다 (키보드가 올라온다)', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { level: 1, name: '이름 입력' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '제가 뭐라고 불러드릴까요?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '닉네임' })).toHaveFocus()
  })

  it('비어 있거나 공백뿐이면 다음 버튼을 막는다', async () => {
    render(<Harness />)
    const next = screen.getByRole('button', { name: '다음' })

    expect(next).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: '닉네임' }), '   ')
    expect(next).toBeDisabled()
  })

  it('6자를 넘게 입력하면 6자까지만 남는다 (이모지 · 특수문자 허용)', async () => {
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: '닉네임' })

    await userEvent.type(input, '민준😀!abcd')
    expect(input).toHaveValue('민준😀!ab')
  })

  it('다음 · 엔터를 누르면 앞뒤 공백을 뺀 이름으로 넘어간다', async () => {
    const onNext = vi.fn()
    render(<Harness onNext={onNext} />)

    await userEvent.type(screen.getByRole('textbox', { name: '닉네임' }), ' 민준 {Enter}')
    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(onNext.mock.calls).toEqual([['민준'], ['민준']])
  })

  it('뒤로가기를 누르면 이전 단계로 간다', async () => {
    const onBack = vi.fn()
    render(<Harness onBack={onBack} />)

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('저장하는 동안에는 버튼을 막고, 실패하면 안내한다', () => {
    const { rerender } = render(<Harness value="붕붕이" submitting />)
    expect(screen.getByRole('button', { name: '저장 중' })).toBeDisabled()

    rerender(<Harness value="붕붕이" error="저장하지 못했어요." />)
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했어요.')
  })
})
