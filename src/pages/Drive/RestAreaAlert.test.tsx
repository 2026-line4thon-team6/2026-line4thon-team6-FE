import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatApproachDistance } from '@/utils/driveStats'
import RestAreaAlert from './RestAreaAlert'

describe('휴게소 접근 알림', () => {
  it('Figma 문구대로 거리와 이름을 보여 주고, 받침에 따라 이/가를 붙인다', () => {
    const { rerender } = render(<RestAreaAlert name="시흥하늘휴게소" meters={2000} onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('전방 2km 앞에 시흥하늘휴게소가 있어요.')

    rerender(<RestAreaAlert name="덕평자연휴게소 주차장" meters={850} onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('전방 900m 앞에 덕평자연휴게소 주차장이 있어요.')
  })

  it('닫기 버튼으로만 닫는다', async () => {
    const onClose = vi.fn()
    render(<RestAreaAlert name="시흥하늘휴게소" meters={1500} onClose={onClose} />)

    await userEvent.click(screen.getByRole('status'))
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '휴게소 알림 닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('거리 표시: 1km 이상은 소수 한 자리 km, 미만은 100m 단위', () => {
    expect(formatApproachDistance(2000)).toBe('2km')
    expect(formatApproachDistance(1540)).toBe('1.5km')
    expect(formatApproachDistance(430)).toBe('400m')
    expect(formatApproachDistance(20)).toBe('100m')
  })
})
