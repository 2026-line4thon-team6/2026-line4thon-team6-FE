import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers } from '@/mocks/records'
import RecordPreview from './RecordPreview'

// Figma 기록 지도 - 폴라로이드 (284:15043), Description 4
const CARD = { ...createMockRecordMarkers()[1].latestCard, title: '우리의 첫 바다 드라이브', driveDate: '2026-11-03' }

function renderPreview(props: Partial<ComponentProps<typeof RecordPreview>> = {}) {
  const handlers = { onOpen: vi.fn(), onShare: vi.fn(), onClose: vi.fn() }
  render(<RecordPreview card={CARD} {...handlers} {...props} />)
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

  it('저장된 사진 2장을 받아 화살표로 넘겨 본다', async () => {
    const loadPhotos = vi.fn().mockResolvedValue(['/first.webp', '/second.webp'])
    const { user, onOpen } = renderPreview({ loadPhotos })

    expect(loadPhotos).toHaveBeenCalledWith(CARD.cardId)
    const list = await screen.findByRole('list', { name: '드라이브 사진' })
    await waitFor(() => expect(within(list).getAllByRole('img', { hidden: true })).toHaveLength(2))

    // 첫 사진에서는 다음 화살표만, 마지막 사진에서는 이전 화살표만
    expect(screen.queryByRole('button', { name: '이전 사진' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음 사진' }))
    expect(screen.queryByRole('button', { name: '다음 사진' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이전 사진' }))
    expect(screen.getByRole('button', { name: '다음 사진' })).toBeInTheDocument()

    // 화살표를 눌러도 상세로 가지 않는다
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('사진이 1장 이하면 화살표를 보여 주지 않는다', async () => {
    const loadPhotos = vi.fn().mockResolvedValue([])
    renderPreview({ loadPhotos })

    await waitFor(() => expect(loadPhotos).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: '다음 사진' })).not.toBeInTheDocument()
    expect(document.querySelector(`img[src="${CARD.thumbnailUrl}"]`)).toBeInTheDocument()
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
