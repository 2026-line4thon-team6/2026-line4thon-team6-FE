import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { PublicPlace } from '@/types/place'
import PublicPlacePage from './PublicPlacePage'

// 공유 링크를 로그인 전 사용자가 열었을 때의 공개 장소 화면 (GET /public/places/{placeId})
type Props = ComponentProps<typeof PublicPlacePage>

const PLACE: PublicPlace = {
  id: 'plc_oido',
  name: '시흥 오이도',
  address: '경기 시흥시 정왕동 오이도',
  coordinate: { latitude: 37.3456, longitude: 126.6878 },
  thumbnailUrl: '/mocks/places/oido-1.webp',
  introduction: '붉은 등대와 아름다운 노을이 어우러진 오이도에서 둘만의 추억을 만들어 보세요.',
}

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onRetry: vi.fn(), onStart: vi.fn() }
  render(<PublicPlacePage status="ready" place={PLACE} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('공개 장소 정보', () => {
  it('대표 사진, 장소명, 주소, 소개를 표시한다', () => {
    renderPage()

    expect(screen.getByRole('img', { name: '시흥 오이도 사진' })).toHaveAttribute('src', '/mocks/places/oido-1.webp')
    expect(screen.getByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()
    expect(screen.getByText('경기 시흥시 정왕동 오이도')).toBeInTheDocument()
    expect(screen.getByText(/붉은 등대와 아름다운 노을이 어우러진/)).toBeInTheDocument()
  })

  it('사진과 소개가 없는 장소는 사진 대신 배경만 깔고, 소개 문단을 그리지 않는다', () => {
    renderPage({ place: { ...PLACE, thumbnailUrl: null, introduction: null } })

    expect(screen.getByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /시흥 오이도/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/붉은 등대/)).not.toBeInTheDocument()
  })

  it('로그인이 필요한 찜 · 공유 · 연인에게 보내기 · 드라이브 시작 버튼은 없다', () => {
    renderPage()

    expect(screen.queryByRole('button', { name: /찜/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '공유하기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '연인에게 보내기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '드라이브 시작하기' })).not.toBeInTheDocument()
  })

  it("'붕붕어스 시작하기'를 누르면 앱 시작(로그인)으로 보낸다", async () => {
    const { user, onStart } = renderPage()

    await user.click(screen.getByRole('button', { name: '붕붕어스 시작하기' }))

    expect(onStart).toHaveBeenCalledOnce()
  })
})

describe('불러오기 상태', () => {
  it('불러오는 중이면 안내 문구를 표시한다', () => {
    renderPage({ status: 'loading', place: null })

    expect(screen.getByRole('status')).toHaveTextContent('장소 정보를 불러오고 있어요.')
  })

  it('없는 장소면 찾을 수 없다고 안내하고, 다시 시도 대신 앱 시작 버튼을 둔다', () => {
    renderPage({ status: 'notFound', place: null })

    expect(screen.getByRole('alert')).toHaveTextContent('장소를 찾을 수 없어요.')
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '붕붕어스 시작하기' })).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', place: null })

    expect(screen.getByRole('alert')).toHaveTextContent('장소 정보를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
