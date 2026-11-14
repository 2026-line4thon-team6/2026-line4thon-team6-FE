import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Card, Reflection } from '@/types/card'
import RecordDetailPage from './RecordDetailPage'

// Figma 기록 지도 - 카드 상세 (284:15397) / 삭제 확인 (284:15470)
type Props = ComponentProps<typeof RecordDetailPage>

const reflection = (nickname: string, text: string, submitted = true): Reflection => ({
  author: { id: `usr_${nickname}`, nickname, birthDate: null, profileImageUrl: null, provider: 'KAKAO' },
  text,
  submitted,
  submittedAt: submitted ? '2026-11-03T09:00:00Z' : null,
  updatedAt: '2026-11-03T09:00:00Z',
  version: 1,
})

const CARD: Card = {
  id: 'crd_01',
  driveId: 'drv_01',
  coupleId: 'cpl_01',
  status: 'COMPLETED',
  title: '우리의 첫 바다 드라이브',
  driveDate: '2026-11-03',
  region: '경기 시흥시 정왕동',
  destination: {
    placeId: 'plc_01',
    name: '시흥 오이도',
    address: '경기 시흥시 정왕동',
    coordinate: { latitude: 37.34, longitude: 126.68 },
  },
  distanceMeters: 43_300,
  activeDurationSeconds: 4_800,
  stampCount: 2,
  playlist: { id: 'ply_01', title: '노을처럼 따뜻한 우리', trackCount: 13, durationSeconds: 3_600, thumbnailUrl: null },
  photos: [
    { mediaId: 'med_2', url: '/second.webp', urlExpiresAt: '', order: 1 },
    { mediaId: 'med_1', url: '/first.webp', urlExpiresAt: '', order: 0 },
  ],
  reflections: [reflection('민준', '노을은 진짜 예뻤다 ㅎㅎ'), reflection('민지', '다음에 또 가자!')],
  editableUntil: '2026-11-04T09:00:00Z',
  completedAt: '2026-11-03T09:00:00Z',
  canEdit: false,
  canDelete: true,
  version: 1,
  driverUserId: null,
}

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onRetry: vi.fn(),
    onDelete: vi.fn().mockResolvedValue('deleted'),
    onPlaylistClick: vi.fn(),
  }
  render(
    <RecordDetailPage
      status="ready"
      card={CARD}
      myUserId="usr_민준"
      myNickname="민준"
      partnerNickname="민지"
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

describe('RecordDetailPage', () => {
  it('날짜 · 제목 · 목적지 · 주행 요약을 보여준다', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '2026년 11월 3일' })).toBeInTheDocument()
    expect(screen.getByText('우리의 첫 바다 드라이브')).toBeInTheDocument()
    expect(screen.getByText('시흥 오이도')).toBeInTheDocument()
    expect(screen.getByText('이동 거리').nextSibling).toHaveTextContent('43.3km')
    expect(screen.getByText('주행 시간').nextSibling).toHaveTextContent('1시간 20분')
    expect(screen.getByText('휴게소 도장').nextSibling).toHaveTextContent('2개')
  })

  it('목적지가 없으면 지역을 보여준다', () => {
    renderPage({ card: { ...CARD, destination: null } })

    expect(screen.getByText('경기 시흥시 정왕동')).toBeInTheDocument()
  })

  it('함께 들었던 플레이리스트를 보여주고, 버튼을 누르면 플레이리스트를 연다', async () => {
    const { user, onPlaylistClick } = renderPage()

    expect(screen.getByText('노을처럼 따뜻한 우리')).toBeInTheDocument()
    expect(screen.getByText('총 13곡 · 약 1시간')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '플레이리스트 보기' }))
    expect(onPlaylistClick).toHaveBeenCalledWith(CARD.playlist)
  })

  it('플레이리스트 화면이 연결되지 않아도 플레이리스트 아이콘은 보여준다 (Figma 284:15440)', () => {
    renderPage({ onPlaylistClick: undefined })

    expect(screen.queryByRole('button', { name: '플레이리스트 보기' })).not.toBeInTheDocument()
    const section = screen.getByRole('region', { name: '함께 들었던 플레이리스트' })
    // 작은 SVG는 data URI로 들어와서 파일명 대신 아이콘 크기(40px)로 찾는다
    expect(section.querySelector('img[width="40"]')).toBeInTheDocument()
  })

  it('플레이리스트를 쓰지 않은 드라이브는 제목 자리에 - - 를 표시하고 버튼을 숨긴다', () => {
    renderPage({ card: { ...CARD, playlist: null } })

    expect(screen.getByText('- -')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '플레이리스트 보기' })).not.toBeInTheDocument()
  })

  it('사진을 순서(order)대로 보여준다', () => {
    renderPage()

    const photos = within(screen.getByRole('list', { name: '드라이브 사진' })).getAllByRole('img')
    expect(photos.map((photo) => photo.getAttribute('src'))).toEqual(['/first.webp', '/second.webp'])
  })

  it('사진이 없으면 사진 영역을 숨긴다', () => {
    renderPage({ card: { ...CARD, photos: [] } })

    expect(screen.queryByRole('list', { name: '드라이브 사진' })).not.toBeInTheDocument()
  })

  // 소감 칸은 나 · 상대방 두 칸을 항상 보여 준다. 비어 있으면 안내 문구 (수정 기간이 끝난 기록)
  const reflectionRows = () =>
    within(screen.getByRole('list', { name: '소감' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent)

  it('두 사람 모두 쓴 소감을 닉네임과 함께 보여 준다', () => {
    renderPage()

    expect(reflectionRows()).toEqual(['민준노을은 진짜 예뻤다 ㅎㅎ', '민지다음에 또 가자!'])
  })

  it('상대방이 쓰지 않은 채 끝났으면 상대방 칸에 남기지 않았다고 안내한다 (제출 전 초안도 쓰지 않은 것)', () => {
    renderPage({ card: { ...CARD, reflections: [reflection('민준', '노을은 진짜 예뻤다 ㅎㅎ'), reflection('민지', '쓰는 중', false)] } })

    expect(reflectionRows()).toEqual(['민준노을은 진짜 예뻤다 ㅎㅎ', '민지상대방이 기록을 남기지 않았어요 :)'])
    expect(screen.queryByText('쓰는 중')).not.toBeInTheDocument()
  })

  it('내가 쓰지 않았으면 내 칸에 작성하지 않았다고 안내한다', () => {
    renderPage({ card: { ...CARD, reflections: [reflection('민지', '다음에 또 가자!')] } })

    expect(reflectionRows()).toEqual(['민준기록을 작성하지 않았어요 :)', '민지다음에 또 가자!'])
  })

  it('둘 다 쓰지 않았어도 두 칸을 보여 준다', () => {
    renderPage({ card: { ...CARD, reflections: [] } })

    expect(reflectionRows()).toEqual(['민준기록을 작성하지 않았어요 :)', '민지상대방이 기록을 남기지 않았어요 :)'])
  })

  it('운전자를 알면 운전자 칸을 먼저 보여 준다 (Figma 284:15397)', () => {
    renderPage({ card: { ...CARD, driverUserId: 'usr_민지' } })

    expect(reflectionRows()).toEqual(['민지다음에 또 가자!', '민준노을은 진짜 예뻤다 ㅎㅎ'])
  })

  it('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
    const { user, onBack } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onBack).toHaveBeenCalled()
  })

  describe('삭제', () => {
    it('휴지통을 누르면 삭제 확인을 띄우고, 취소하면 닫는다', async () => {
      const { user, onDelete } = renderPage()

      await user.click(screen.getByRole('button', { name: '카드 삭제' }))
      const dialog = screen.getByRole('dialog', { name: '카드를 삭제하시겠어요?' })
      expect(within(dialog).getByText('삭제한 드라이브 기록은 복구할 수 없어요.')).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: '취소' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onDelete).not.toHaveBeenCalled()
    })

    it('삭제하기를 누르면 삭제를 요청한다', async () => {
      const { user, onDelete } = renderPage()

      await user.click(screen.getByRole('button', { name: '카드 삭제' }))
      await user.click(screen.getByRole('button', { name: '삭제하기' }))

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('삭제에 실패하면 팝업에 안내를 보여주고 다시 시도할 수 있다', async () => {
      const onDelete = vi.fn().mockResolvedValueOnce('failed').mockResolvedValueOnce('conflict')
      const { user } = renderPage({ onDelete })

      await user.click(screen.getByRole('button', { name: '카드 삭제' }))
      await user.click(screen.getByRole('button', { name: '삭제하기' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('삭제하지 못했어요. 다시 시도해 주세요.')

      await user.click(screen.getByRole('button', { name: '삭제하기' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('카드 내용이 바뀌었어요. 확인 후 다시 삭제해 주세요.')
    })

    it('삭제할 수 없는 카드는 휴지통을 숨긴다', () => {
      renderPage({ card: { ...CARD, canDelete: false } })

      expect(screen.queryByRole('button', { name: '카드 삭제' })).not.toBeInTheDocument()
    })
  })

  describe('불러오기 상태', () => {
    const ME = { myUserId: 'usr_민준', myNickname: '민준', partnerNickname: '민지' }

    it('불러오는 중 · 없는 카드 · 오류를 안내한다', async () => {
      const { unmount } = render(<RecordDetailPage status="loading" card={null} onBack={vi.fn()} onRetry={vi.fn()} onDelete={vi.fn()} {...ME} />)
      expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중이에요')
      unmount()

      const notFound = render(<RecordDetailPage status="notFound" card={null} onBack={vi.fn()} onRetry={vi.fn()} onDelete={vi.fn()} {...ME} />)
      expect(screen.getByRole('alert')).toHaveTextContent('삭제되었거나 볼 수 없는 기록이에요')
      notFound.unmount()

      const onRetry = vi.fn()
      render(<RecordDetailPage status="error" card={null} onBack={vi.fn()} onRetry={onRetry} onDelete={vi.fn()} {...ME} />)
      await userEvent.setup().click(screen.getByRole('button', { name: '다시 시도' }))
      expect(onRetry).toHaveBeenCalled()
    })
  })
})
