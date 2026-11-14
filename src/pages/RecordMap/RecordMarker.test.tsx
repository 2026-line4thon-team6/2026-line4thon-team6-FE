import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers } from '@/mocks/records'
import RecordMarker from './RecordMarker'

const [MARKER] = createMockRecordMarkers()

describe('RecordMarker', () => {
  it('최신 기록의 대표 사진을 보여준다', () => {
    const { container } = render(<RecordMarker marker={{ ...MARKER, recordCount: 1 }} onClick={() => {}} />)

    const photo = container.querySelector(`img[src="${MARKER.latestCard.thumbnailUrl}"]`)
    expect(photo).toBeInTheDocument()
  })

  it('기록이 하나면 +N을 표시하지 않는다', () => {
    render(<RecordMarker marker={{ ...MARKER, recordCount: 1 }} onClick={() => {}} />)

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: `${MARKER.latestCard.title} 기록 보기` })).toBeInTheDocument()
  })

  it('같은 목적지 기록이 여러 개면 나머지 수를 +N으로 표시한다', () => {
    render(<RecordMarker marker={{ ...MARKER, recordCount: 3 }} onClick={() => {}} />)

    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `${MARKER.latestCard.title} 외 2개 기록 보기` })).toBeInTheDocument()
  })

  it('누르면 해당 마커를 알려준다', async () => {
    const onClick = vi.fn()
    render(<RecordMarker marker={MARKER} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledWith(MARKER)
  })
})
