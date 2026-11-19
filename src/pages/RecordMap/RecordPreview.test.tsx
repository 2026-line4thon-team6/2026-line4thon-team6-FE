import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers } from '@/mocks/records'
import type { RecordMapMarker } from '@/types/record'
import RecordPreview from './RecordPreview'

// Figma 기록 지도 - 폴라로이드 (284:15043), Description 4
const BASE = createMockRecordMarkers()[1]
const CARD = { ...BASE.latestCard, title: '우리의 첫 바다 드라이브', driveDate: '2026-11-03' }
const SECOND = { ...CARD, cardId: 'crd_second', title: '두 번째 바다', driveDate: '2026-10-12', thumbnailUrl: '/second.webp' }
const THIRD = { ...CARD, cardId: 'crd_third', title: '세 번째 바다', driveDate: '2026-09-01', thumbnailUrl: '/third.webp' }
const SINGLE: RecordMapMarker = { ...BASE, latestCard: CARD, recordCount: 1 }
const GROUP: RecordMapMarker = { ...BASE, latestCard: CARD, recordCount: 3 }

function renderPreview(props: Partial<ComponentProps<typeof RecordPreview>> = {}) {
  const handlers = { onOpen: vi.fn(), onShare: vi.fn(), onClose: vi.fn() }
  render(<RecordPreview marker={SINGLE} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

const openButton = (title: string) => screen.getByRole('button', { name: `${title} 기록 자세히 보기` })

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

    await user.click(openButton('우리의 첫 바다 드라이브'))

    expect(onOpen).toHaveBeenCalledWith(CARD)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('공유 버튼을 누르면 이 기록의 공유를 요청한다', async () => {
    const { user, onShare } = renderPreview()

    await user.click(screen.getByRole('button', { name: '공유하기' }))

    expect(onShare).toHaveBeenCalledWith(CARD)
  })

  it('같은 장소에 기록이 여러 개면 대표 카드부터 보여 주고, 화살표로 다른 기록 카드를 넘겨 본다', async () => {
    const loadGroup = vi.fn().mockResolvedValue([CARD, SECOND, THIRD])
    const { user, onOpen, onShare } = renderPreview({ marker: GROUP, loadGroup })

    expect(loadGroup).toHaveBeenCalledWith(GROUP)
    expect(screen.queryByRole('button', { name: '이전 기록' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '다음 기록' }))

    // 지금 보이는 기록 카드로 상세 · 공유가 바뀐다
    await user.click(openButton('두 번째 바다'))
    expect(onOpen).toHaveBeenLastCalledWith(SECOND)
    await user.click(screen.getByRole('button', { name: '공유하기' }))
    expect(onShare).toHaveBeenLastCalledWith(SECOND)

    await user.click(screen.getByRole('button', { name: '다음 기록' }))
    expect(screen.queryByRole('button', { name: '다음 기록' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이전 기록' }))
    expect(screen.getByRole('button', { name: '다음 기록' })).toBeInTheDocument()
  })

  it('카드를 옆으로 밀면 다음 기록으로 넘어가고, 민 것은 카드 열기로 치지 않는다', async () => {
    const loadGroup = vi.fn().mockResolvedValue([CARD, SECOND])
    const { onOpen } = renderPreview({ marker: GROUP, loadGroup })
    await screen.findByRole('button', { name: '다음 기록' })
    const area = screen.getByRole('list', { name: '이 장소의 드라이브 기록' }).parentElement!

    // jsdom의 PointerEvent는 좌표를 넘기지 않아 MouseEvent로 포인터 이벤트를 만든다
    const pointer = (type: string, clientX: number) => fireEvent(area, new MouseEvent(type, { bubbles: true, clientX }))
    pointer('pointerdown', 200)
    pointer('pointermove', 100)
    pointer('pointerup', 100)
    fireEvent.click(area)

    expect(screen.getByRole('button', { name: '이전 기록' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 기록' })).not.toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('기록이 한 개인 장소는 따로 불러오지 않고 화살표도 없다', () => {
    const loadGroup = vi.fn()
    renderPreview({ loadGroup })

    expect(loadGroup).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '다음 기록' })).not.toBeInTheDocument()
  })

  it('다른 기록을 불러오지 못하면 대표 카드만 보여 준다', async () => {
    const loadGroup = vi.fn().mockRejectedValue(new Error('network'))
    renderPreview({ marker: GROUP, loadGroup })

    await waitFor(() => expect(loadGroup).toHaveBeenCalled())
    expect(openButton('우리의 첫 바다 드라이브')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 기록' })).not.toBeInTheDocument()
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
