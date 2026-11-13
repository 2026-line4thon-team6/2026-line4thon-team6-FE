import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_PLAYLIST_LIBRARY } from '@/mocks/playlists'
import PlaylistsPage from './PlaylistsPage'

const meta = {
  title: 'Pages/Archive/Playlists',
  component: PlaylistsPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    playlists: MOCK_PLAYLIST_LIBRARY.items,
    totalCount: MOCK_PLAYLIST_LIBRARY.totalCount,
    onBack: fn(),
    onRetry: fn(),
    onPlaylistClick: fn(),
  },
} satisfies Meta<typeof PlaylistsPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: My_UI > 플리 보관함
export const Default: Story = {}

// 대표 이미지 · 연결된 드라이브가 없고 제목이 길 때
export const Fallbacks: Story = {
  args: {
    playlists: [
      {
        ...MOCK_PLAYLIST_LIBRARY.items[0],
        title: '비 오는 날 창문 열고 듣기 좋은 잔잔한 노래 모음',
        thumbnailUrl: null,
        driveId: null,
        driveTitle: null,
      },
      { ...MOCK_PLAYLIST_LIBRARY.items[1], driveTitle: '주말 아침 일찍 출발한 동해안 일주 드라이브' },
    ],
    totalCount: 2,
  },
}

export const Empty: Story = {
  args: { playlists: [], totalCount: 0 },
}

export const LoadError: Story = {
  args: { status: 'error', playlists: [], totalCount: 0 },
}
