import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_RADIO_EPISODES } from '@/mocks/radio'
import RadioStoriesPage from './RadioStoriesPage'

// Figma 'My_UI > 라디오 사연 보관함' · API 명세 GET /radio/episodes 기준
type Props = ComponentProps<typeof RadioStoriesPage>

const EPISODES = MOCK_RADIO_EPISODES

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onBack: vi.fn(), onRetry: vi.fn(), onQueryChange: vi.fn(), onStoryClick: vi.fn() }
  render(<RadioStoriesPage status="ready" episodes={EPISODES} query="" keyword="" {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

it('제목을 보여 주고 뒤로가기를 누르면 돌아간다', async () => {
  const { user, onBack } = renderPage()

  expect(screen.getByRole('heading', { level: 1, name: '라디오 사연 보관함' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(onBack).toHaveBeenCalled()
})

describe('검색창', () => {
  it('안내 문구를 보여 주고, 입력하면 검색어를 바꾼다', async () => {
    const { user, onQueryChange } = renderPage()

    const search = screen.getByRole('searchbox', { name: '사연 검색' })
    expect(search).toHaveAttribute('placeholder', '지난 사연을 검색해보세요.')
    await user.type(search, '바')
    expect(onQueryChange).toHaveBeenLastCalledWith('바')
  })

  it('검색어는 100자까지 입력할 수 있다', () => {
    renderPage()

    expect(screen.getByRole('searchbox', { name: '사연 검색' })).toHaveAttribute('maxLength', '100')
  })
})

describe('사연 목록', () => {
  it('보낸 사연을 순서대로 보여 준다', () => {
    renderPage()

    const items = within(screen.getByRole('list', { name: '보낸 사연' })).getAllByRole('button')
    expect(items).toHaveLength(10)
    expect(items[0]).toHaveTextContent(/^오늘 날씨가 너무 좋아서/)
    expect(items[9]).toHaveTextContent(/^갑자기 나한테 전여친/)
  })

  it('사연을 누르면 그 사연을 연다', async () => {
    const { user, onStoryClick } = renderPage()

    await user.click(screen.getByRole('button', { name: /^바다 가는 길에/ }))
    expect(onStoryClick).toHaveBeenCalledWith('rad_02')
  })
})

describe('상태', () => {
  it('보낸 사연이 없으면 안내한다', () => {
    renderPage({ episodes: [] })

    expect(screen.getByText('아직 보낸 사연이 없어요.')).toBeInTheDocument()
  })

  it('검색 결과가 없으면 검색어와 함께 안내한다', () => {
    renderPage({ episodes: [], query: '고양이', keyword: '고양이' })

    expect(screen.getByText("'고양이'에 맞는 사연이 없어요.")).toBeInTheDocument()
  })

  it('불러오지 못해도 검색창은 남기고 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', episodes: [] })

    expect(screen.getByRole('searchbox', { name: '사연 검색' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
