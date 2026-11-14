import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { PlaceSummary } from '@/types/place'
import FavoritesPage from './FavoritesPage'

// Figma 'My_UI > 찜한 드라이브' · API 명세 GET /me/favorite-places 기준
type Props = ComponentProps<typeof FavoritesPage>

const place = (overrides: Partial<PlaceSummary>): PlaceSummary => ({
  id: 'plc_01',
  name: '시흥 오이도',
  region: '경기 시흥시',
  address: '경기 시흥시',
  coordinate: { latitude: 37.3, longitude: 126.6 },
  thumbnailUrl: null,
  category: 'SEA',
  hashtags: ['일몰', '해안도로'],
  estimatedDurationSeconds: 3600,
  distanceMeters: null,
  isFavorite: true,
  ...overrides,
})

const PLACES = [
  place({}),
  place({ id: 'plc_02', name: '인천 을왕리 해수욕장', region: '인천 중구', estimatedDurationSeconds: 4200, hashtags: ['바다', '노을'] }),
]

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onRetry: vi.fn(),
    onSelectCategory: vi.fn(),
    onFavoriteToggle: vi.fn(),
    onPlaceClick: vi.fn(),
  }
  render(<FavoritesPage status="ready" places={PLACES} category={null} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('헤더', () => {
  it('제목을 보여 주고 뒤로가기를 누르면 돌아간다', async () => {
    const { user, onBack } = renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '찜한 드라이브 코스' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('카테고리 칩', () => {
  it('바다 · 야경 · 근교 카페 · 자연 · 차박 순서로 보여 준다', () => {
    renderPage()

    const chips = within(screen.getByRole('list', { name: '카테고리' })).getAllByRole('button')
    expect(chips.map((chip) => chip.textContent)).toEqual(['바다', '야경', '근교 카페', '자연', '차박'])
  })

  it('고른 칩을 표시하고, 칩을 누르면 그 카테고리를 요청한다', async () => {
    const { user, onSelectCategory } = renderPage({ category: 'NIGHT_VIEW' })

    expect(screen.getByRole('button', { name: '야경' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '바다' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: '근교 카페' }))
    expect(onSelectCategory).toHaveBeenCalledWith('NEARBY_CAFE')
  })
})

describe('코스 카드', () => {
  it('이름, 지역 · 예상 소요 시간, 해시태그를 보여 준다', () => {
    renderPage()

    const card = screen.getByRole('article', { name: '인천 을왕리 해수욕장' })
    expect(card).toHaveTextContent('인천 중구 · 약 1시간 10분')
    expect(within(card).getAllByRole('listitem').map((tag) => tag.textContent)).toEqual(['#바다', '#노을'])
  })

  it('카드를 누르면 장소 상세로 이동한다', async () => {
    const { user, onPlaceClick } = renderPage()

    await user.click(screen.getByRole('button', { name: '시흥 오이도' }))
    expect(onPlaceClick).toHaveBeenCalledWith('plc_01')
  })

  it('하트를 누르면 찜을 취소하고, 비워진 하트를 다시 누르면 찜한다', async () => {
    const { user, onFavoriteToggle } = renderPage({ places: [place({}), place({ id: 'plc_02', name: '강릉 헌화로', isFavorite: false })] })

    await user.click(within(screen.getByRole('article', { name: '시흥 오이도' })).getByRole('button', { name: '좋아요 취소' }))
    expect(onFavoriteToggle).toHaveBeenCalledWith('plc_01', false)

    await user.click(within(screen.getByRole('article', { name: '강릉 헌화로' })).getByRole('button', { name: '좋아요' }))
    expect(onFavoriteToggle).toHaveBeenCalledWith('plc_02', true)
  })
})

describe('상태', () => {
  it('찜한 코스가 없으면 안내한다', () => {
    renderPage({ places: [] })

    expect(screen.getByText('아직 찜한 드라이브 코스가 없어요.')).toBeInTheDocument()
  })

  it('고른 카테고리에 찜한 코스가 없으면 그렇게 안내한다', () => {
    renderPage({ places: [], category: 'CAR_CAMPING' })

    expect(screen.getByText('차박 카테고리에 찜한 코스가 없어요.')).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', places: [] })

    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('불러오는 중에도 칩은 보여 준다', () => {
    renderPage({ status: 'loading', places: [] })

    expect(screen.getByRole('status')).toHaveTextContent('찜한 코스를 불러오는 중이에요.')
    expect(screen.getByRole('button', { name: '바다' })).toBeInTheDocument()
  })
})
