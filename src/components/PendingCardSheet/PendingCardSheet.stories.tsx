import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import PendingCardSheet from './PendingCardSheet'

const meta = {
  title: 'Components/PendingCardSheet',
  component: PendingCardSheet,
  parameters: { layout: 'fullscreen' },
  args: {
    cards: [
      {
        cardId: 'crd_1',
        driveId: 'drv_1',
        title: '우리의 첫 바다 드라이브',
        remainingSeconds: 42 * 60 + 5,
        writing: true,
        endedAt: '2026-11-16T09:30:00.000Z',
      },
      {
        cardId: 'crd_2',
        driveId: 'drv_2',
        title: '남산 야경 보러 가는 길',
        remainingSeconds: 9 * 3600 + 12 * 60,
        writing: false,
        endedAt: '2026-11-16T22:40:00.000Z',
      },
      {
        cardId: 'crd_3',
        driveId: 'drv_3',
        title: '퇴근길 드라이브',
        remainingSeconds: 21 * 3600,
        writing: false,
        endedAt: '2026-11-17T10:00:00.000Z',
      },
    ],
    onSelect: fn(),
    onClose: fn(),
    onDiscard: fn(async () => 'deleted' as const),
  },
} satisfies Meta<typeof PendingCardSheet>

export default meta
type Story = StoryObj<typeof meta>

// 미작성 카드가 2개 이상일 때 배너를 누르면 뜨는 목록 (Figma 시안 없음)
export const Default: Story = {}
