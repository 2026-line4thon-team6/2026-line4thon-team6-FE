import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_RADIO_EPISODES } from '@/mocks/radio'
import RadioStoryPage from './RadioStoryPage'

// Figma My_UI > 보관함 상세 (812:10416)
const meta = {
  title: 'Pages/RadioStory',
  component: RadioStoryPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    episode: MOCK_RADIO_EPISODES[0],
    onBack: fn(),
    onRetry: fn(),
    onAudioError: fn(),
  },
} satisfies Meta<typeof RadioStoryPage>

export default meta
type Story = StoryObj<typeof meta>

// 음성 URL이 있어 재생 · 정지를 누를 수 있는 상태
export const Default: Story = {
  args: {
    episode: {
      ...MOCK_RADIO_EPISODES[0],
      audioUrl: 'https://cdn.example.com/radio/rad_01.mp3',
      audioUrlExpiresAt: '2099-01-01T00:00:00Z',
    },
  },
}

// 음성이 아직 없으면 재생 · 정지 버튼이 흐려진다 (목 서버 기본값)
export const NoAudio: Story = {}

export const Loading: Story = {
  args: { status: 'loading', episode: null },
}

export const LoadError: Story = {
  args: { status: 'error', episode: null },
}

export const NotFound: Story = {
  args: { status: 'notFound', episode: null },
}
