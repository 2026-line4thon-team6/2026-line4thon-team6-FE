import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import CardPromptModal from './CardPromptModal'

const meta = {
  title: 'Components/CardPromptModal',
  component: CardPromptModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    variant: 'arrived',
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof CardPromptModal>

export default meta
type Story = StoryObj<typeof meta>

// Figma: 드라이브 끝 (목적지 도착)
export const Arrived: Story = {}

// Figma: 홈-드라이브 카드 미작성 팝업
export const Pending: Story = {
  args: { variant: 'pending', remainingSeconds: 18 * 3600 },
}
