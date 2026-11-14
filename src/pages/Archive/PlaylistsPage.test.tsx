import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_PLAYLIST_LIBRARY } from '@/mocks/playlists'
import PlaylistsPage from './PlaylistsPage'

// Figma 'My_UI > 플리 보관함' · API 명세 GET /me/playlists 기준
type Props = ComponentProps<typeof PlaylistsPage>

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onBack: vi.fn(), onRetry: vi.fn(), onPlaylistClick: vi.fn() }
  render(
    <PlaylistsPage
      status="ready"
      playlists={MOCK_PLAYLIST_LIBRARY.items}
      totalCount={MOCK_PLAYLIST_LIBRARY.totalCount}
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

it('제목을 보여 주고 뒤로가기를 누르면 돌아간다', async () => {
  const { user, onBack } = renderPage()

  expect(screen.getByRole('heading', { level: 1, name: '플레이리스트 보관함' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(onBack).toHaveBeenCalled()
})

it('저장한 플레이리스트 전체 개수를 보여 준다', () => {
  renderPage({ totalCount: 12 })

  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('내가 저장한 플레이리스트 12개')
})

describe('플레이리스트 카드', () => {
  it('드라이브 제목 배지, 플레이리스트 제목, 곡 수 · 재생 시간을 보여 준다', () => {
    renderPage()

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('우리의 첫 바다 드라이브')
    expect(items[0]).toHaveTextContent('노을처럼 따뜻한 우리')
    expect(items[0]).toHaveTextContent('총 13곡 · 약 52분')
  })

  it('재생 시간이 1시간을 넘으면 시간 단위로 보여 준다 (기능명세서 09 생성 완료 표기)', () => {
    renderPage({ playlists: [{ ...MOCK_PLAYLIST_LIBRARY.items[0], durationSeconds: 3900 }] })

    expect(screen.getByRole('button', { name: /노을처럼 따뜻한 우리/ })).toHaveTextContent('총 13곡 · 약 1시간 5분')
  })

  it('연결된 드라이브가 없으면 배지를 숨긴다', () => {
    renderPage({ playlists: [{ ...MOCK_PLAYLIST_LIBRARY.items[0], driveId: null, driveTitle: null }] })

    expect(screen.queryByText('우리의 첫 바다 드라이브')).not.toBeInTheDocument()
  })

  it('카드를 누르면 그 플레이리스트를 연다', async () => {
    const { user, onPlaylistClick } = renderPage()

    await user.click(screen.getByRole('button', { name: /바다 보며 달리는 여름/ }))
    expect(onPlaylistClick).toHaveBeenCalledWith('ply_02')
  })
})

describe('상태', () => {
  it('저장한 플레이리스트가 없으면 안내한다', () => {
    renderPage({ playlists: [], totalCount: 0 })

    expect(screen.getByText('아직 저장한 플레이리스트가 없어요.')).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', playlists: [], totalCount: 0 })

    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
