import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { fn } from 'storybook/test'
import CoupleInvitePage from './CoupleInvitePage'

type Props = ComponentProps<typeof CoupleInvitePage>

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
    // 'minji2026'만 연결에 성공하고, 'minji2025'는 예전에 연결했던 연인이라 다시 연결할지 묻는다
    onConnect: fn<Props['onConnect']>(async (code) => {
      if (code.trim() === 'minji2026') return { status: 'connected' }
      if (code.trim() === 'minji2025') return { status: 'restore' }
      return { status: 'failed', message: '코드를 다시 확인해 주세요.' }
    }),
    onRestore: fn<Props['onRestore']>(async () => null),
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

// 예전에 연결했던 연인의 코드를 입력하면 다시 연결할지 묻는다 (아무 코드나 입력하고 완료)
export const RestoreRequired: Story = {
  args: { onConnect: fn<Props['onConnect']>(async () => ({ status: 'restore' })) },
}

// 다시 연결하려 했지만 예전 연결 정보가 없을 때
export const RestoreFailed: Story = {
  args: {
    onConnect: fn<Props['onConnect']>(async () => ({ status: 'restore' })),
    onRestore: fn<Props['onRestore']>(async () => '다시 연결할 예전 연결 정보가 없어요. 연인의 새 코드를 확인해 주세요.'),
  },
}
