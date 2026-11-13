import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import LoginPage from './LoginPage'

const meta = {
  title: 'Pages/Login',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'idle',
    error: null,
    onKakaoLogin: fn(),
  },
} satisfies Meta<typeof LoginPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: Onboarding_UI > 로그인 (484:13466)
export const Default: Story = {}

export const Loading: Story = {
  args: { status: 'loading' },
}

export const LoginError: Story = {
  args: { error: '로그인하지 못했어요. 다시 시도해 주세요.' },
}
