import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import DriveEndModal from './DriveEndModal'

// Figma 1046:10305 (드라이브 마치기 팝업 · 설명형 + 텍스트 링크)
function renderModal(props: Partial<ComponentProps<typeof DriveEndModal>> = {}) {
  const handlers = { onRecord: vi.fn(), onSkip: vi.fn(), onEditRoute: vi.fn(), onClose: vi.fn() }
  render(<DriveEndModal busy={false} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('DriveEndModal', () => {
  it('마치면 카드가 남는다고 안내하고, 기록하러 가기 · 기록하지 않고 나가기 · 경로 수정하기를 보여 준다', () => {
    renderModal()

    const dialog = screen.getByRole('dialog', { name: '드라이브를 마치시겠어요?' })
    expect(dialog).toHaveTextContent('기록하러 가면 드라이브가 끝나고')
    expect(dialog).toHaveTextContent('오늘의 추억이 카드로 남아요.')
    expect(within(dialog).getByText('카드로 남아요')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '경로 수정하기' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '기록하지 않고 나가기' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '기록하러 가기' })).toBeInTheDocument()
  })

  it('각 버튼이 맞는 동작을 부른다', async () => {
    const { user, onRecord, onSkip, onEditRoute, onClose } = renderModal()

    await user.click(screen.getByRole('button', { name: '기록하러 가기' }))
    await user.click(screen.getByRole('button', { name: '기록하지 않고 나가기' }))
    await user.click(screen.getByRole('button', { name: '경로 수정하기' }))
    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(onRecord).toHaveBeenCalledTimes(1)
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onEditRoute).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('마치는 중에는 두 버튼을 막아 두 번 끝내지 않는다', () => {
    renderModal({ busy: true })

    expect(screen.getByRole('button', { name: '기록하러 가기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '기록하지 않고 나가기' })).toBeDisabled()
  })
})
