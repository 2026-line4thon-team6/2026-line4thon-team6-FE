import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CardPromptModal from './CardPromptModal'

// Figma '드라이브 끝'(목적지 도착 팝업), '홈-드라이브 카드 미작성 팝업' 기준
function renderModal(props: Partial<Parameters<typeof CardPromptModal>[0]> = {}) {
  const handlers = { onConfirm: vi.fn(), onClose: vi.fn() }
  render(<CardPromptModal variant="arrived" {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('목적지 도착 팝업', () => {
  it('도착을 알리고 카드를 작성할지 묻는다', () => {
    renderModal({ variant: 'arrived' })

    expect(screen.getByRole('dialog', { name: '목적지에 도착했어요! 드라이브 카드를 작성해볼까요?' })).toBeInTheDocument()
    expect(screen.getByText('오늘의 드라이브를 특별한 추억으로 남겨보세요.')).toBeInTheDocument()
  })

  it("'카드 작성하기'는 작성 화면으로, '아니요'는 팝업을 닫는다", async () => {
    const { user, onConfirm, onClose } = renderModal({ variant: 'arrived' })

    await user.click(screen.getByRole('button', { name: '카드 작성하기' }))
    expect(onConfirm).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '아니요' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('홈 미작성 카드 팝업', () => {
  it('남은 시간과 함께 아직 작성하지 않은 카드가 있다고 알린다', () => {
    renderModal({ variant: 'pending', remainingSeconds: 18 * 3600 })

    expect(screen.getByRole('dialog', { name: '아직 작성하지 않은 드라이브 카드가 있어요' })).toBeInTheDocument()
    expect(screen.getByText('남은 시간 18:00:00')).toBeInTheDocument()
    expect(screen.getByText('24시간이 지나면 작성 기회가 사라져버려요.')).toBeInTheDocument()
  })

  it("'카드 작성하러 가기'는 작성 화면으로, '나중에'와 닫기는 팝업을 닫는다", async () => {
    const { user, onConfirm, onClose } = renderModal({ variant: 'pending', remainingSeconds: 60 })

    await user.click(screen.getByRole('button', { name: '카드 작성하러 가기' }))
    expect(onConfirm).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '나중에' }))
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
