import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecords } from '@/mocks/records'
import RecordShareSheet from './RecordShareSheet'

// Figma 기록 지도 - 공유 (284:15197)
const CARD = createMockRecords().find((record) => record.cardId === 'crd_02')!

function setup(link: Parameters<typeof RecordShareSheet>[0]['link'] = { status: 'ready', url: 'https://bunbungus.app/cards/crd_02' }) {
  const handlers = { onClose: vi.fn(), onCopyLink: vi.fn(), onShareChannel: vi.fn() }
  render(<RecordShareSheet card={CARD} link={link} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

const sheet = () => screen.getByRole('dialog', { name: '드라이브 기록 카드 공유하기' })

describe('RecordShareSheet', () => {
  it('공유할 기록 카드 미리보기와 안내 문구, 공유 링크를 보여준다', () => {
    setup()

    expect(within(sheet()).getByRole('heading', { name: '드라이브 기록 카드' })).toBeInTheDocument()
    expect(within(sheet()).getByText('우리가 함께 달린 길을 공유해보세요.')).toBeInTheDocument()
    expect(within(sheet()).getByText(CARD.title)).toBeInTheDocument()
    expect(within(sheet()).getByText('https://bunbungus.app/cards/crd_02')).toBeInTheDocument()
  })

  it('복사 버튼을 누르면 링크를 복사한다', async () => {
    const { user, onCopyLink } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '링크 복사' }))

    expect(onCopyLink).toHaveBeenCalledWith('https://bunbungus.app/cards/crd_02')
  })

  it('공유 채널을 누르면 그 채널로 공유한다', async () => {
    const { user, onShareChannel } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '인스타그램' }))
    await user.click(within(sheet()).getByRole('button', { name: '카카오톡' }))

    expect(onShareChannel).toHaveBeenNthCalledWith(1, 'instagram', 'https://bunbungus.app/cards/crd_02')
    expect(onShareChannel).toHaveBeenNthCalledWith(2, 'kakaotalk', 'https://bunbungus.app/cards/crd_02')
  })

  it('링크를 불러오는 중이거나 실패하면 안내하고 공유 버튼을 막는다', () => {
    const { unmount } = render(
      <RecordShareSheet card={CARD} link={{ status: 'loading' }} onClose={vi.fn()} onCopyLink={vi.fn()} onShareChannel={vi.fn()} />,
    )
    expect(screen.getByText('링크를 불러오고 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '인스타그램' })).toBeDisabled()
    unmount()

    setup({ status: 'error' })
    expect(screen.getByText('링크를 불러오지 못했어요.')).toBeInTheDocument()
  })

  it('닫기 버튼을 누르면 닫는다', async () => {
    const { user, onClose } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalled()
  })
})
