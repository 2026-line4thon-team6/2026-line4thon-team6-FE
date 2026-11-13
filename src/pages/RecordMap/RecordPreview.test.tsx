import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers } from '@/mocks/records'
import RecordPreview from './RecordPreview'

// Figma 기록 지도 - 폴라로이드 (284:15043), Description 4
const CARD = { ...createMockRecordMarkers()[1].latestCard, title: '우리의 첫 바다 드라이브', driveDate: '2026-11-03' }

function renderPreview() {
  const handlers = { onOpen: vi.fn(), onShare: vi.fn(), onClose: vi.fn() }
  render(<RecordPreview card={CARD} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('RecordPreview', () => {
  it('대표 사진 · 제목 · 날짜와 안내 문구를 보여준다', () => {
    renderPreview()

    expect(screen.getByRole('dialog', { name: '드라이브 기록 미리보기' })).toBeInTheDocument()
    expect(screen.getByText('우리의 첫 바다 드라이브')).toBeInTheDocument()
    expect(screen.getByText('2026년 11월 3일')).toBeInTheDocument()
    expect(screen.getByText('카드를 눌러 자세한 기록을 확인해 보세요.')).toBeInTheDocument()
    expect(document.querySelector(`img[src="${CARD.thumbnailUrl}"]`)).toBeInTheDocument()
  })

  it('카드를 누르면 기록 상세로 이동을 요청한다', async () => {
    const { user, onOpen, onClose } = renderPreview()

    await user.click(screen.getByRole('button', { name: '우리의 첫 바다 드라이브 기록 자세히 보기' }))

    expect(onOpen).toHaveBeenCalledWith(CARD)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('공유 버튼을 누르면 이 기록의 공유를 요청한다', async () => {
    const { user, onShare } = renderPreview()

    await user.click(screen.getByRole('button', { name: '공유하기' }))

    expect(onShare).toHaveBeenCalledWith(CARD)
  })

  it('카드 바깥을 누르면 닫는다', async () => {
    const { user, onClose } = renderPreview()

    await user.click(screen.getByTestId('record-preview-backdrop'))

    expect(onClose).toHaveBeenCalled()
  })

  it('Esc를 누르면 닫는다', async () => {
    const { user, onClose } = renderPreview()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
