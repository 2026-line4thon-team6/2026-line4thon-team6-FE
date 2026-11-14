import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import PendingCardBanner from './PendingCardBanner'

const meta = {
  title: 'Components/PendingCardBanner',
  component: PendingCardBanner,
  decorators: [
    (Story) => (
      <div style={{ width: 348 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    count: 1,
    remainingSeconds: 18 * 3600,
    onClick: fn(),
  },
} satisfies Meta<typeof PendingCardBanner>

export default meta
type Story = StoryObj<typeof meta>

// Figma: 카드 미작성 배너
export const Default: Story = {}

export const Several: Story = {
  args: { count: 3, remainingSeconds: 42 * 60 + 5 },
}
