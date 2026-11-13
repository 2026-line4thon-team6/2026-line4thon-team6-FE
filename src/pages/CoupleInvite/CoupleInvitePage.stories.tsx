import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import CoupleInvitePage from './CoupleInvitePage'

const meta = {
  title: 'Pages/CoupleInvite',
  component: CoupleInvitePage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    code: '23Wh8N',
    onBack: fn(),
    onRetry: fn(),
    onCopy: fn(async () => {}),
    onShare: fn(async () => 'copied' as const),
    // 'minji2026'만 연결에 성공한다
    onConnect: fn(async (code: string) => (code.trim() === 'minji2026' ? null : '코드를 다시 확인해 주세요.')),
    onConnected: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof CoupleInvitePage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: Onboarding_UI > 연인 초대
export const Default: Story = {}

export const Loading: Story = {
  args: { status: 'loading', code: null },
}

export const LoadError: Story = {
  args: { status: 'error', code: null },
}

export const AlreadyLinked: Story = {
  args: { status: 'linked', code: null },
}
