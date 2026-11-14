import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RecordCalendarSheet from './RecordCalendarSheet'

// 백엔드 주소가 없어 목 데이터로 응답한다. 2026년 10월 기록: 3 · 11 · 18 · 24일, 9월: 6 · 13 · 20 · 27일
function setup(props: Partial<Parameters<typeof RecordCalendarSheet>[0]> = {}) {
  const handlers = { onSelect: vi.fn(), onClose: vi.fn() }
  render(<RecordCalendarSheet selectedDate={null} today="2026-10-28" {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

const dialog = () => screen.getByRole('dialog', { name: '날짜로 기록 검색' })
const day = (name: string) => within(dialog()).getByRole('button', { name })

describe('RecordCalendarSheet', () => {
  it('오늘이 있는 달을 띄우고, 기록이 있는 날짜만 고를 수 있다', async () => {
    setup()

    expect(within(dialog()).getByRole('heading', { name: '2026년 10월' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '2026년 10월 24일' })).toBeEnabled()
    expect(day('2026년 10월 3일')).toBeEnabled()
    expect(day('2026년 10월 4일')).toBeDisabled()
    expect(day('2026년 10월 28일')).toBeDisabled()
  })

  it('날짜를 누르면 그 날짜를 고른다', async () => {
    const { user, onSelect } = setup()

    await user.click(await screen.findByRole('button', { name: '2026년 10월 24일' }))

    expect(onSelect).toHaveBeenCalledWith('2026-10-24')
  })

  it('이미 고른 날짜가 있으면 그 달을 띄우고 선택 표시를 한다', async () => {
    setup({ selectedDate: '2026-09-13' })

    expect(within(dialog()).getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '2026년 9월 13일' })).toHaveAttribute('aria-pressed', 'true')
    expect(day('2026년 9월 6일')).toHaveAttribute('aria-pressed', 'false')
  })

  it('이전 달로 넘길 수 있고, 오늘이 있는 달보다 뒤로는 넘길 수 없다', async () => {
    const { user } = setup()

    expect(within(dialog()).queryByRole('button', { name: '다음 달' })).not.toBeInTheDocument()

    await user.click(within(dialog()).getByRole('button', { name: '이전 달' }))
    expect(within(dialog()).getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '2026년 9월 6일' })).toBeEnabled()

    await user.click(within(dialog()).getByRole('button', { name: '다음 달' }))
    expect(within(dialog()).getByRole('heading', { name: '2026년 10월' })).toBeInTheDocument()
  })

  it('바깥을 누르거나 Esc를 누르면 닫는다', async () => {
    const { user, onClose } = setup()

    await user.click(screen.getByTestId('record-calendar-backdrop'))
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
