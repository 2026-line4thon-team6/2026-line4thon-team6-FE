import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import DateWheelPicker from './DateWheelPicker'

// Figma 'My_UI > 커플 페이지' 시작일 변경 바텀시트의 년 · 월 · 일 휠
const MAX = '2026-11-13'

function Controlled({ initial, onChange }: { initial: string; onChange?: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <DateWheelPicker
      value={value}
      max={MAX}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const column = (name: string) => within(screen.getByRole('listbox', { name }))
const selected = (name: string) => column(name).getByRole('option', { selected: true }).textContent

describe('DateWheelPicker', () => {
  it('년 · 월 · 일 세 칸에 현재 값을 선택해 보여 준다', () => {
    render(<Controlled initial="2026-10-20" />)

    expect(selected('년')).toBe('2026년')
    expect(selected('월')).toBe('10월')
    expect(selected('일')).toBe('20일')
  })

  it('항목을 누르면 그 값으로 바뀐다', async () => {
    const onChange = vi.fn()
    render(<Controlled initial="2026-10-20" onChange={onChange} />)
    const user = userEvent.setup()

    await user.click(column('년').getByRole('option', { name: '2025년' }))
    await user.click(column('월').getByRole('option', { name: '09월' }))

    expect(onChange).toHaveBeenLastCalledWith('2025-09-20')
  })

  it('방향키로 한 칸씩 움직인다', async () => {
    const onChange = vi.fn()
    render(<Controlled initial="2026-10-20" onChange={onChange} />)
    const user = userEvent.setup()

    screen.getByRole('listbox', { name: '일' }).focus()
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenLastCalledWith('2026-10-19')

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(onChange).toHaveBeenLastCalledWith('2026-10-21')
  })

  it('달을 바꿔 날짜가 넘치면 그 달의 마지막 날로 맞춘다', async () => {
    const onChange = vi.fn()
    render(<Controlled initial="2025-01-31" onChange={onChange} />)

    await userEvent.setup().click(column('월').getByRole('option', { name: '02월' }))

    expect(onChange).toHaveBeenLastCalledWith('2025-02-28')
    expect(column('일').queryByRole('option', { name: '29일' })).not.toBeInTheDocument()
  })

  it('오늘 이후 날짜는 고를 수 없다', async () => {
    const onChange = vi.fn()
    render(<Controlled initial="2026-10-20" onChange={onChange} />)

    expect(column('년').queryByRole('option', { name: '2027년' })).not.toBeInTheDocument()
    const december = column('월').getByRole('option', { name: '12월' })
    expect(december).toHaveAttribute('aria-disabled', 'true')

    await userEvent.setup().click(december)
    expect(onChange).not.toHaveBeenCalled()
  })
})
