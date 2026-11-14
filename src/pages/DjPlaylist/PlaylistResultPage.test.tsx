import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Playlist } from '@/types/playlist'
import PlaylistResultPage from './PlaylistResultPage'

const playlist: Playlist = {
  id: 'ply_1',
  title: '노을처럼 따뜻한 우리',
  moods: ['EXCITING', 'EMOTIONAL'],
  weather: 'SUNNY',
  genres: ['BALLAD'],
  targetDurationSeconds: 3600,
  tracks: [
    ['trk_1', '너의 모든 순간', '성시경', 280],
    ['trk_2', 'Love wins all', '아이유', 272],
    ['trk_3', '첫 눈', 'EXO', 272],
  ].map(([id, title, artist, durationSeconds], index) => ({
    id: id as string,
    providerTrackId: `sp_${index}`,
    title: title as string,
    artist: artist as string,
    durationSeconds: durationSeconds as number,
    albumImageUrl: null,
    providerUri: null,
    externalUrl: null,
    order: index + 1,
  })),
  trackCount: 3,
  durationSeconds: 3600,
  savedByMe: false,
  createdAt: '2026-11-15T00:00:00Z',
  version: 1,
}

const renderPage = (props: Partial<Parameters<typeof PlaylistResultPage>[0]> = {}) =>
  render(
    <PlaylistResultPage
      playlist={playlist}
      onToggleSave={vi.fn()}
      onReorder={vi.fn()}
      onDelete={vi.fn()}
      onRestart={vi.fn()}
      onPlayAll={vi.fn()}
      onBack={vi.fn()}
      {...props}
    />,
  )

// jsdom에는 PointerEvent가 없어 clientX가 전달되지 않는다
beforeAll(() => {
  window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent
})

describe('DJ 플레이리스트 생성 완료', () => {
  it('제목 · 곡 수 · 길이 · 고른 키워드 · 곡 목록을 보여 준다', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '노을처럼 따뜻한 우리' })).toBeInTheDocument()
    expect(screen.getByText('총 3곡 · 약 1시간 00분')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: '선택한 키워드' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      ['😆신나는', '🌙감성적인', '🌞맑음', '🎧발라드'],
    )
    const rows = within(screen.getByRole('list', { name: '곡 목록' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('01너의 모든 순간성시경04:40')
  })

  it('저장 아이콘을 누르면 저장을 알린다', async () => {
    const onToggleSave = vi.fn()
    renderPage({ onToggleSave })

    await userEvent.click(screen.getByRole('button', { name: '플레이리스트 저장' }))
    expect(onToggleSave).toHaveBeenCalledTimes(1)
  })

  it('곡을 왼쪽으로 밀면 삭제 버튼이 나오고, 누르면 그 곡을 지운다', async () => {
    const onDelete = vi.fn()
    renderPage({ onDelete })
    const row = within(screen.getByRole('list', { name: '곡 목록' })).getAllByRole('listitem')[1]
    const body = row.firstElementChild as HTMLElement

    fireEvent.pointerDown(body, { clientX: 300 })
    fireEvent.pointerUp(body, { clientX: 220 })
    await userEvent.click(within(row).getByRole('button', { name: '삭제' }))
    expect(onDelete).toHaveBeenCalledWith('trk_2')
  })
})
