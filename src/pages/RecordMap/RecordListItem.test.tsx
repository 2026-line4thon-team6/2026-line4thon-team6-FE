import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecords } from '@/mocks/records'
import type { RecordSummary } from '@/types/record'
import RecordListItem from './RecordListItem'

// Figma 기록 지도 - 목록형 (284:14758), Description 7
const RECORD: RecordSummary = {
  ...createMockRecords()[0],
  title: '우리의 첫 바다 드라이브',
  driveDate: '2026-11-03',
  distanceMeters: 43_300,
  activeDurationSeconds: 4_800,
}

describe('RecordListItem', () => {
  it('날짜 · 대표 사진 · 제목 · 목적지 · 이동 거리 · 주행 시간을 보여준다', () => {
    render(<RecordListItem record={RECORD} onClick={() => {}} />)

    const item = screen.getByRole('button', { name: /우리의 첫 바다 드라이브/ })
    expect(item).toHaveTextContent('2026년')
    expect(item).toHaveTextContent('11.03')
    expect(item).toHaveTextContent('화')
    expect(item).toHaveTextContent(RECORD.destination!.name)
    expect(item).toHaveTextContent('43.3km')
    expect(item).toHaveTextContent('1시간 20분')
    expect(item.querySelector(`img[src="${RECORD.thumbnailUrl}"]`)).toBeInTheDocument()
  })

  it('목적지를 정하지 않은 기록은 목적지 미설정으로 표시한다', () => {
    render(<RecordListItem record={{ ...RECORD, destination: null }} onClick={() => {}} />)

    expect(screen.getByRole('button')).toHaveTextContent('목적지 미설정')
  })

  it('누르면 해당 기록을 알려준다', async () => {
    const onClick = vi.fn()
    render(<RecordListItem record={RECORD} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledWith(RECORD)
  })
})
