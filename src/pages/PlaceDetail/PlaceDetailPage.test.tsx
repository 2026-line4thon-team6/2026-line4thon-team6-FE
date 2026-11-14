import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { mockFetchPlaceDetail } from '@/mocks/places'
import PlaceDetailPage from './PlaceDetailPage'

// 기능명세서 '4️⃣ 스마트 탐색 상세', '5️⃣ 공유하기 바텀시트', '6️⃣ 연인에게 보내기 확인 팝업' 기준
type Props = ComponentProps<typeof PlaceDetailPage>

const SHARE_URL = 'https://bunbungus.app/places/1'
const { data: OIDO } = await mockFetchPlaceDetail('1')
const { data: HEONHWARO } = await mockFetchPlaceDetail('2')

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onRetry: vi.fn(),
    onFavoriteToggle: vi.fn(),
    onStartDrive: vi.fn(),
    getShareUrl: vi.fn().mockResolvedValue(SHARE_URL),
    onCopyLink: vi.fn(),
    onShareChannel: vi.fn(),
    onSendToPartner: vi.fn().mockResolvedValue(undefined),
    onConnectRequired: vi.fn(),
  }
  render(<PlaceDetailPage status="ready" detail={OIDO} partnerNickname="민지" {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('장소 정보', () => {
  it('장소명, 위치와 예상 시간, 카테고리, 해시태그, 소개를 표시한다', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()
    expect(screen.getByText('경기 시흥시 · 약 1시간')).toBeInTheDocument()
    expect(screen.getByText('바다')).toBeInTheDocument()
    expect(screen.getByText('#일몰')).toBeInTheDocument()
    expect(screen.getByText('#해안도로')).toBeInTheDocument()
    expect(screen.getByText('#드라이브코스')).toBeInTheDocument()
    expect(screen.getByText(/붉은 등대와 아름다운 노을이 어우러진/)).toBeInTheDocument()
  })

  it('드라이브 정보 요약 4가지를 표시한다', () => {
    renderPage()

    const summary = within(screen.getByRole('list', { name: '드라이브 정보' }))
    const [duration, roads, parking, visit] = summary.getAllByRole('listitem')
    expect(duration).toHaveTextContent('예상 소요 시간약 1시간')
    expect(roads).toHaveTextContent('주요 경로서해안 고속도로')
    expect(parking).toHaveTextContent('주차 정보공영주차장 이용 가능')
    expect(visit).toHaveTextContent('추천 방문 시간오후 5-8시(일몰 시간대)')
  })

  it("정보가 없는 항목은 '--'로 표시하고, 경로를 모르면 경로 미리보기를 안내 문구로 대신한다", () => {
    renderPage({
      detail: { ...HEONHWARO, place: { ...HEONHWARO.place, estimatedDurationSeconds: null } },
    })

    for (const item of within(screen.getByRole('list', { name: '드라이브 정보' })).getAllByRole('listitem')) {
      expect(item).toHaveTextContent('--')
    }
    expect(screen.getByText('강원 강릉시 · --')).toBeInTheDocument()
    expect(screen.getByText('위치 권한을 허용하면 경로를 볼 수 있어요.')).toBeInTheDocument()
    expect(screen.queryByText('출발지')).not.toBeInTheDocument()
  })

  it('경로가 있으면 출발지와 도착지를 표시한다', () => {
    renderPage()

    expect(screen.getByText('출발지')).toBeInTheDocument()
    expect(screen.getByText('도착지')).toBeInTheDocument()
  })

  it('맨 위에는 대표 사진 1장만 보여 주고, 넘기기 · 장수 표시 · 본문 썸네일은 없다', () => {
    renderPage({
      detail: { ...OIDO, photos: ['/a.webp', '/b.webp', '/c.webp', '/d.webp'] },
    })

    const photos = screen.getAllByRole('img', { name: /시흥 오이도/ })
    expect(photos).toHaveLength(1)
    expect(photos[0]).toHaveAttribute('src', '/a.webp')
    expect(screen.queryByText(/^\d+ \/ \d+$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('사진이 없으면 장소 썸네일을 대신 보여 준다', () => {
    renderPage({ detail: { ...HEONHWARO, photos: [] } })

    expect(screen.getByRole('img', { name: '강릉 헌화로 사진' })).toHaveAttribute('src', HEONHWARO.place.thumbnailUrl)
  })
})

describe('상단 · 하단 버튼', () => {
  it('뒤로가기를 탭하면 이전 화면으로 돌아가기를 요청한다', async () => {
    const { user, onBack } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('하트를 탭하면 찜 상태 변경을 요청한다', async () => {
    const { user, onFavoriteToggle } = renderPage()

    await user.click(screen.getByRole('button', { name: '좋아요 취소' }))

    expect(onFavoriteToggle).toHaveBeenCalledWith(false)
  })

  it('드라이브 시작하기를 탭하면 이 장소로 드라이브 시작을 요청한다', async () => {
    const { user, onStartDrive } = renderPage()

    await user.click(screen.getByRole('button', { name: '드라이브 시작하기' }))

    expect(onStartDrive).toHaveBeenCalledTimes(1)
  })
})

describe('공유하기 바텀시트', () => {
  it('공유 아이콘을 탭하면 장소 요약과 공유 링크를 표시한다', async () => {
    const { user, getShareUrl } = renderPage()

    await user.click(screen.getByRole('button', { name: '공유하기' }))

    const sheet = within(screen.getByRole('dialog', { name: '공유하기' }))
    expect(sheet.getByText('시흥 오이도')).toBeInTheDocument()
    expect(sheet.getByText('경기 시흥시 · 약 1시간')).toBeInTheDocument()
    expect(await sheet.findByText(SHARE_URL)).toBeInTheDocument()
    expect(getShareUrl).toHaveBeenCalledTimes(1)
  })

  it('복사 아이콘을 탭하면 링크 복사를 요청한다', async () => {
    const { user, onCopyLink } = renderPage()
    await user.click(screen.getByRole('button', { name: '공유하기' }))
    await screen.findByText(SHARE_URL)

    await user.click(screen.getByRole('button', { name: '링크 복사' }))

    expect(onCopyLink).toHaveBeenCalledWith(SHARE_URL)
  })

  it.each([
    ['카카오톡', 'kakaotalk'],
    ['인스타그램', 'instagram'],
    ['X', 'x'],
    ['페이스북', 'facebook'],
  ])('%s을(를) 탭하면 해당 앱으로 공유를 요청한다', async (label, channel) => {
    const { user, onShareChannel } = renderPage()
    await user.click(screen.getByRole('button', { name: '공유하기' }))
    await screen.findByText(SHARE_URL)

    await user.click(screen.getByRole('button', { name: label }))

    expect(onShareChannel).toHaveBeenCalledWith(channel, SHARE_URL)
  })

  it('링크를 받아오기 전에는 복사와 공유 버튼을 누를 수 없다', async () => {
    const { user } = renderPage({ getShareUrl: vi.fn(() => new Promise<string>(() => {})) })

    await user.click(screen.getByRole('button', { name: '공유하기' }))

    expect(screen.getByRole('button', { name: '링크 복사' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '카카오톡' })).toBeDisabled()
  })

  it('링크를 받아오지 못하면 안내 문구를 표시한다', async () => {
    const { user } = renderPage({ getShareUrl: vi.fn().mockRejectedValue(new Error('network')) })

    await user.click(screen.getByRole('button', { name: '공유하기' }))

    expect(await screen.findByText('링크를 불러오지 못했어요.')).toBeInTheDocument()
  })

  it('닫기를 탭하면 시트를 닫는다', async () => {
    const { user } = renderPage()
    await user.click(screen.getByRole('button', { name: '공유하기' }))

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '닫기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('연인에게 보내기', () => {
  it('버튼을 탭하면 연인 이름이 들어간 확인 팝업을 표시한다', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('민지님에게 이 드라이브 코스를보내시겠어요?')
    expect(dialog).toHaveTextContent('연인에게 함께 가고 싶은 마음을 전달해 보세요.')
  })

  it('취소를 탭하면 보내지 않고 팝업을 닫는다', async () => {
    const { user, onSendToPartner } = renderPage()
    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onSendToPartner).not.toHaveBeenCalled()
  })

  it('보내기를 탭하면 전송하고 전송 완료 안내로 바뀐다', async () => {
    const { user, onSendToPartner } = renderPage()
    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(onSendToPartner).toHaveBeenCalledTimes(1)
    const dialog = await screen.findByRole('dialog', { name: '드라이브 코스 전송 완료!' })
    expect(dialog).toHaveTextContent('민지님에게 드라이브 코스를 보냈어요.')

    // 팝업 오른쪽 위 X 버튼과 아래 '닫기' 버튼 둘 다 닫는다. 아래 버튼을 누른다
    await user.click(within(dialog).getAllByRole('button', { name: '닫기' })[1])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('전송 중에는 보내기를 다시 누를 수 없다', async () => {
    const onSendToPartner = vi.fn(() => new Promise<void>(() => {}))
    const { user } = renderPage({ onSendToPartner })
    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(screen.getByRole('button', { name: '보내는 중…' })).toBeDisabled()
    expect(onSendToPartner).toHaveBeenCalledTimes(1)
  })

  it('전송에 실패하면 안내 문구를 표시하고 다시 보낼 수 있다', async () => {
    const onSendToPartner = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(undefined)
    const { user } = renderPage({ onSendToPartner })
    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    await user.click(screen.getByRole('button', { name: '보내기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('전송하지 못했어요. 다시 시도해 주세요.')

    await user.click(screen.getByRole('button', { name: '보내기' }))
    expect(await screen.findByRole('dialog', { name: '드라이브 코스 전송 완료!' })).toBeInTheDocument()
  })

  it('연인과 연결되지 않았으면 팝업 대신 커플 연결을 요청한다', async () => {
    const { user, onConnectRequired } = renderPage({ partnerNickname: null })

    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))

    expect(onConnectRequired).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('불러오기 상태', () => {
  it('불러오는 중에는 안내를 표시한다', () => {
    renderPage({ status: 'loading', detail: null })

    expect(screen.getByRole('status')).toHaveTextContent('장소 정보를 불러오고 있어요.')
  })

  it('불러오지 못하면 안내와 다시 시도 버튼, 뒤로가기를 표시한다', async () => {
    const { user, onRetry, onBack } = renderPage({ status: 'error', detail: null })

    expect(screen.getByRole('alert')).toHaveTextContent('장소 정보를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
