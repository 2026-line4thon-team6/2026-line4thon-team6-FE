import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import NotificationButton from './NotificationButton'

const meta = {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  tags: ['autodocs'],
  args: {
    hasUnread: false,
    onClick: fn(),
  },
} satisfies Meta<typeof NotificationButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Unread: Story = {
  args: { hasUnread: true },
}
