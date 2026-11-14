import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import DateStepPage from './DateStepPage'

// 기능명세서 'L5 생일 입력' · 'L7 연인과 만난 날'. Figma 484:13842 · 484:14079
type Props = ComponentProps<typeof DateStepPage>

function Harness(props: Partial<Props>) {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <DateStepPage
      title="생년월일 입력"
      question="생일이 언제신가요?"
      label="생일"
      onBack={vi.fn()}
      onNext={vi.fn()}
      {...props}
      value={value}
      onChange={setValue}
    />
  )
}

describe('날짜 입력 단계', () => {
  it('yyyy.mm.dd 안내를 보여 주고, 숫자를 입력하면 앞에서부터 채워진다', async () => {
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: '생일' })

    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('placeholder', 'yyyy.mm.dd')
    expect(input).toHaveAttribute('inputmode', 'numeric')

    await userEvent.type(input, '200305')
    expect(input).toHaveValue('2003.05')
    await userEvent.type(input, '06')
    expect(input).toHaveValue('2003.05.06')
  })

  it('날짜를 다 입력해야 다음 버튼이 켜지고, 누르면 YYYY-MM-DD로 넘긴다', async () => {
    const onNext = vi.fn()
    render(<Harness onNext={onNext} />)
    const next = screen.getByRole('button', { name: '다음' })

    await userEvent.type(screen.getByRole('textbox', { name: '생일' }), '2003050')
    expect(next).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox', { name: '생일' }), '6')
    await userEvent.click(next)
    expect(onNext).toHaveBeenCalledWith('2003-05-06')
  })

  it('없는 날짜 · 미래 날짜면 안내하고 넘어가지 않는다', async () => {
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: '생일' })

    await userEvent.type(input, '20030230')
    expect(screen.getByRole('alert')).toHaveTextContent('날짜를 다시 확인해 주세요.')
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()

    await userEvent.clear(input)
    await userEvent.type(input, `${new Date().getFullYear() + 1}0101`)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('건너뛰기가 있는 단계(만난 날)는 날짜 없이 넘어갈 수 있다', async () => {
    const onSkip = vi.fn()
    render(<Harness title="기념일 입력" question="연인과 언제부터 만났나요?" label="만난 날" onSkip={onSkip} />)

    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('건너뛰기가 없는 단계(생일)는 건너뛰기 버튼이 없다', () => {
    render(<Harness />)

    expect(screen.queryByRole('button', { name: '건너뛰기' })).not.toBeInTheDocument()
  })
})
