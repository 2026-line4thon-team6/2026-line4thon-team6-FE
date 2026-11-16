import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_RADIO_EPISODES } from '@/mocks/radio'
import RadioStoriesDrawer from './RadioStoriesDrawer'

// 주행 중 라디오 화면의 '보낸 사연 목록' 서랍. 보관함과 같은 GET /radio/episodes 목록을 쓴다
type Props = ComponentProps<typeof RadioStoriesDrawer>

function renderDrawer(props: Partial<Props> = {}) {
  const handlers = {
    onQueryChange: vi.fn(),
    onRetry: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onLoadMore: vi.fn(),
  }
  render(
    <RadioStoriesDrawer
      status="ready"
      episodes={MOCK_RADIO_EPISODES}
      query=""
      keyword=""
      hasMore={false}
      loadingMore={false}
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

it('보낸 사연을 탭하면 그 사연을 고른다', async () => {
  const { user, onSelect } = renderDrawer()

  await user.click(screen.getByRole('button', { name: MOCK_RADIO_EPISODES[0].story! }))

  expect(onSelect).toHaveBeenCalledWith(MOCK_RADIO_EPISODES[0])
})

describe('더 보기 (보관함 · 알림 목록과 같은 방식)', () => {
  it('다음 페이지가 있으면 더 보기 버튼을 보여 주고, 누르면 다음 페이지를 요청한다', async () => {
    const { user, onLoadMore } = renderDrawer({ hasMore: true })

    await user.click(screen.getByRole('button', { name: '더 보기' }))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('다음 페이지가 없으면 더 보기 버튼이 없다', () => {
    renderDrawer({ hasMore: false })

    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument()
  })

  it('다음 페이지를 불러오는 동안에는 누를 수 없다', () => {
    renderDrawer({ hasMore: true, loadingMore: true })

    expect(screen.getByRole('button', { name: '불러오는 중…' })).toBeDisabled()
  })
})
