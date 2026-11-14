import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_CARD_DRIVE_ID, mockFetchDriveCard, resetMockCards } from '@/mocks/cards'
import type { Card } from '@/types/card'
import DriveCardPage from './DriveCardPage'

// Figma 'DriveMode -> Card' (카드 작성 · 카드 작성 완료 · 카드작성 중단 팝업창) 기준
type Props = ComponentProps<typeof DriveCardPage>

resetMockCards()
const { data: EMPTY_CARD } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)

const withPhotos = (count: number): Card => ({
  ...EMPTY_CARD,
  status: 'DRAFT',
  photos: Array.from({ length: count }, (_, index) => ({
    mediaId: `med_${index + 1}`,
    url: `/mocks/cards/photo-${index + 1}.webp`,
    urlExpiresAt: '2026-11-04T00:00:00Z',
    order: index,
  })),
})

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onMyTextChange: vi.fn(),
    onLeave: vi.fn(),
    onRetry: vi.fn(),
    onAddPhotos: vi.fn(),
    onRemovePhoto: vi.fn(),
    onSwapPhotos: vi.fn(),
    onSave: vi.fn(),
  }
  render(
    <DriveCardPage
      status="ready"
      card={EMPTY_CARD}
      myRole="PASSENGER"
      myNickname="민준"
      partnerNickname="민지"
      myText=""
      partnerText={null}
      canSave={false}
      busy={false}
      error={null}
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('드라이브 정보', () => {
  it('날짜, 드라이브명, 지역, 이동 거리 · 주행 시간 · 휴게소 도장을 표시한다', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '2026년 11월 3일' })).toBeInTheDocument()
    expect(screen.getByText('우리의 첫 바다 드라이브')).toBeInTheDocument()
    expect(screen.getByText('시흥 오이도')).toBeInTheDocument()

    const stats = within(screen.getByRole('list', { name: '드라이브 기록' }))
    const [distance, time, stamps] = stats.getAllByRole('listitem')
    expect(distance).toHaveTextContent('이동 거리43.3km')
    expect(time).toHaveTextContent('주행 시간1시간 20분')
    expect(stamps).toHaveTextContent('휴게소 도장2개')
  })

  it('함께 들었던 플레이리스트의 제목 · 곡 수 · 재생 시간을 표시하고, 없으면 영역을 숨긴다', () => {
    renderPage()

    const playlist = screen.getByRole('region', { name: '함께 들었던 플레이리스트' })
    expect(playlist).toHaveTextContent('노을처럼 따뜻한 우리')
    expect(playlist).toHaveTextContent('총 13곡 · 약 54분')
  })

  it('플레이리스트가 없으면 영역을 숨긴다', () => {
    renderPage({ card: { ...EMPTY_CARD, playlist: null } })

    expect(screen.queryByRole('region', { name: '함께 들었던 플레이리스트' })).not.toBeInTheDocument()
  })
})

describe('사진', () => {
  it('사진이 없으면 사진 추가 영역을 누르고 앨범에서 고른 사진을 올린다', async () => {
    const { user, onAddPhotos } = renderPage()
    const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText('사진 추가하기'), file)

    expect(onAddPhotos).toHaveBeenCalledWith([file])
  })

  it('앨범에서는 JPEG · PNG · WebP를 여러 장 고를 수 있다', () => {
    renderPage()

    const input = screen.getByLabelText('사진 추가하기')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    expect(input).toHaveAttribute('multiple')
  })

  it('올린 사진을 순서대로 보여 주고, 휴지통 버튼으로 지운다', async () => {
    const { user, onRemovePhoto } = renderPage({ card: withPhotos(2) })

    expect(screen.getAllByRole('img', { name: /드라이브 사진/ }).map((img) => img.getAttribute('src'))).toEqual([
      '/mocks/cards/photo-1.webp',
      '/mocks/cards/photo-2.webp',
    ])

    await user.click(screen.getByRole('button', { name: '2번째 사진 삭제' }))
    expect(onRemovePhoto).toHaveBeenCalledWith('med_2')
  })

  it('더보기 메뉴: 2장이면 사진 추가는 막고 순서 변경을 할 수 있다', async () => {
    const { user, onSwapPhotos } = renderPage({ card: withPhotos(2) })

    await user.click(screen.getByRole('button', { name: '사진 메뉴' }))
    const menu = within(screen.getByRole('menu'))
    expect(menu.getByRole('menuitem', { name: '사진 추가하기' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(menu.getByRole('menuitem', { name: '순서 변경하기' }))
    expect(onSwapPhotos).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('더보기 메뉴: 1장이면 순서 변경은 막고 사진을 더 추가할 수 있다', async () => {
    const { user, onAddPhotos } = renderPage({ card: withPhotos(1) })

    await user.click(screen.getByRole('button', { name: '사진 메뉴' }))
    const menu = within(screen.getByRole('menu'))
    expect(menu.getByRole('menuitem', { name: '순서 변경하기' })).toHaveAttribute('aria-disabled', 'true')

    const file = new File(['b'], 'b.png', { type: 'image/png' })
    await user.upload(menu.getByLabelText('사진 추가하기'), file)
    expect(onAddPhotos).toHaveBeenCalledWith([file])
  })

  it('메뉴 바깥을 누르면 메뉴를 닫는다', async () => {
    const { user } = renderPage({ card: withPhotos(2) })

    await user.click(screen.getByRole('button', { name: '사진 메뉴' }))
    await user.click(screen.getByText('시흥 오이도'))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// 소감 칸 이름은 운전자 · 동승자 대신 각자의 닉네임으로 표시한다 (역할은 캐릭터 그림으로 구분)
describe('한 줄 소감', () => {
  it('내가 동승자면 동승자 칸(내 닉네임)에 입력하고, 운전자 칸(연인 닉네임)에는 아직 안 썼다고 안내한다', async () => {
    const { user, onMyTextChange } = renderPage({ myRole: 'PASSENGER' })

    expect(screen.queryByText('동승자')).not.toBeInTheDocument()
    expect(screen.queryByText('운전자')).not.toBeInTheDocument()
    const passenger = within(screen.getByRole('group', { name: '민준' }))
    const input = passenger.getByRole('textbox', { name: '내 한 줄 소감' })
    expect(input).toHaveAttribute('placeholder', '드라이브의 한줄 소감을 작성해주세요 :)')
    expect(input).toHaveAttribute('maxLength', '70')

    await user.type(input, '좋')
    expect(onMyTextChange).toHaveBeenCalledWith('좋')

    const driver = within(screen.getByRole('group', { name: '민지' }))
    expect(driver.queryByRole('textbox')).not.toBeInTheDocument()
    expect(driver.getByText('상대방이 아직 소감을 입력하지 않았어요 :)')).toBeInTheDocument()
  })

  it('내가 운전자면 운전자 칸(내 닉네임)에 입력하고, 연인이 쓴 소감은 동승자 칸(연인 닉네임)에 보여 준다', () => {
    renderPage({ myRole: 'DRIVER', myText: '운전하느라 힘들었지만', partnerText: '노을은 진짜 예뻤다 ㅎㅎ' })

    const driver = within(screen.getByRole('group', { name: '민준' }))
    expect(driver.getByRole('textbox', { name: '내 한 줄 소감' })).toHaveValue('운전하느라 힘들었지만')

    const passenger = within(screen.getByRole('group', { name: '민지' }))
    expect(passenger.getByText('노을은 진짜 예뻤다 ㅎㅎ')).toBeInTheDocument()
  })

  it('동승자 · 운전자 순서로 표시한다', () => {
    renderPage({ myRole: 'DRIVER' })

    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['민지', '민준'])
  })
})

describe('저장하기', () => {
  it('사진이나 소감이 하나도 없으면 저장 버튼을 막는다', () => {
    renderPage({ canSave: false })

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('저장 버튼을 누르면 저장한다', async () => {
    const { user, onSave } = renderPage({ canSave: true })

    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(onSave).toHaveBeenCalled()
  })

  it('저장 중에는 버튼을 막고 진행 중임을 알린다', () => {
    renderPage({ canSave: true, busy: true })

    expect(screen.getByRole('button', { name: '저장 중…' })).toBeDisabled()
  })

  it('오류 안내 문구를 알린다', () => {
    renderPage({ error: '사진은 2장까지 넣을 수 있어요.' })

    expect(screen.getByRole('alert')).toHaveTextContent('사진은 2장까지 넣을 수 있어요.')
  })
})

describe('뒤로가기 · 작성 중단 팝업', () => {
  it('저장 전에 뒤로가면 작성을 마칠지 묻는다', async () => {
    const { user, onLeave } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    const dialog = within(screen.getByRole('dialog', { name: '작성을 마치시겠습니까?' }))
    expect(dialog.getByText(/24시간 내로 카드를 저장하지/)).toBeInTheDocument()
    expect(onLeave).not.toHaveBeenCalled()
  })

  it("'나가기'를 누르면 화면을 나간다", async () => {
    const { user, onLeave } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(screen.getByRole('button', { name: '나가기' }))

    expect(onLeave).toHaveBeenCalled()
  })

  it("'계속 작성하기'나 닫기를 누르면 팝업만 닫는다", async () => {
    const { user, onLeave } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(screen.getByRole('button', { name: '계속 작성하기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onLeave).not.toHaveBeenCalled()
  })

  it('이미 저장한 카드는 묻지 않고 나간다', async () => {
    const { user, onLeave } = renderPage({ card: { ...EMPTY_CARD, status: 'COMPLETED' } })

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onLeave).toHaveBeenCalled()
  })
})

describe('불러오기 상태', () => {
  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', card: null })

    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalled()
  })

  it('작성할 수 없는 카드면 안내하고 뒤로갈 수 있다', async () => {
    const { user, onLeave } = renderPage({ status: 'unavailable', card: null })

    expect(screen.getByText('작성 기간이 지났거나 작성할 수 없는 카드예요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(onLeave).toHaveBeenCalled()
  })
})
