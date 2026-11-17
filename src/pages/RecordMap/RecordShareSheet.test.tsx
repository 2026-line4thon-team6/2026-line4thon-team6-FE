import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecords } from '@/mocks/records'
import RecordShareSheet from './RecordShareSheet'

// Figma 기록 지도 - 공유 (284:15197)
const CARD = createMockRecords().find((record) => record.cardId === 'crd_02')!

function setup(link: Parameters<typeof RecordShareSheet>[0]['link'] = { status: 'ready', url: 'https://bunbungus.app/cards/crd_02' }) {
  const handlers = {
    onClose: vi.fn(),
    onCopyImage: vi.fn().mockResolvedValue('image'),
    onSaveImage: vi.fn().mockResolvedValue('downloaded'),
    onShareChannel: vi.fn(),
  }
  render(<RecordShareSheet card={CARD} link={link} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

const sheet = () => screen.getByRole('dialog', { name: '드라이브 기록 카드 공유하기' })

describe('RecordShareSheet', () => {
  it('공유할 기록 카드 미리보기와 안내 문구, 이미지 복사 · 저장 버튼을 보여준다', () => {
    setup()

    expect(within(sheet()).getByRole('heading', { name: '드라이브 기록 카드' })).toBeInTheDocument()
    expect(within(sheet()).getByText('우리가 함께 달린 길을 공유해보세요.')).toBeInTheDocument()
    expect(within(sheet()).getByText(CARD.title)).toBeInTheDocument()
    expect(within(sheet()).getByRole('button', { name: '이미지 복사' })).toBeInTheDocument()
    expect(within(sheet()).getByRole('button', { name: '이미지 저장' })).toBeInTheDocument()
  })

  // 기능명세서 1️⃣1️⃣: 복사했는지 알 수 있게 토스트로 알린다
  it('이미지 복사를 누르면 공유 이미지를 복사하고 알린다', async () => {
    const { user, onCopyImage } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '이미지 복사' }))

    expect(onCopyImage).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('status')).toHaveTextContent('이미지를 복사했어요.')
  })

  it('이미지를 복사할 수 없는 브라우저라 링크를 복사했으면 그렇다고 알린다', async () => {
    const { user, onCopyImage } = setup()
    onCopyImage.mockResolvedValue('link')

    await user.click(within(sheet()).getByRole('button', { name: '이미지 복사' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미지를 복사할 수 없어 링크를 복사했어요.')
  })

  it('복사하지 못하면 다시 시도하라고 알린다', async () => {
    const { user, onCopyImage } = setup()
    onCopyImage.mockRejectedValue(new Error('denied'))

    await user.click(within(sheet()).getByRole('button', { name: '이미지 복사' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미지를 복사하지 못했어요. 다시 시도해 주세요.')
  })

  it('이미지 저장을 누르면 공유 이미지를 저장하고, 파일로 내려받았으면 알린다', async () => {
    const { user, onSaveImage } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '이미지 저장' }))

    expect(onSaveImage).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('status')).toHaveTextContent('이미지를 저장했어요.')
  })

  it('저장하지 못하면 다시 시도하라고 알린다', async () => {
    const { user, onSaveImage } = setup()
    onSaveImage.mockRejectedValue(new Error('canvas'))

    await user.click(within(sheet()).getByRole('button', { name: '이미지 저장' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미지를 저장하지 못했어요. 다시 시도해 주세요.')
  })

  it('공유 채널을 누르면 그 채널로 공유한다', async () => {
    const { user, onShareChannel } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '인스타그램' }))
    await user.click(within(sheet()).getByRole('button', { name: '카카오톡' }))

    expect(onShareChannel).toHaveBeenNthCalledWith(1, 'instagram', 'https://bunbungus.app/cards/crd_02')
    expect(onShareChannel).toHaveBeenNthCalledWith(2, 'kakaotalk', 'https://bunbungus.app/cards/crd_02')
  })

  it('링크를 불러오는 중에는 채널 공유를 막지만, 이미지 복사 · 저장은 링크 없이도 쓸 수 있다', () => {
    render(
      <RecordShareSheet
        card={CARD}
        link={{ status: 'loading' }}
        onClose={vi.fn()}
        onCopyImage={vi.fn()}
        onSaveImage={vi.fn()}
        onShareChannel={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '인스타그램' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '이미지 복사' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '이미지 저장' })).toBeEnabled()
  })

  it('닫기 버튼을 누르면 닫는다', async () => {
    const { user, onClose } = setup()

    await user.click(within(sheet()).getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalled()
  })
})
