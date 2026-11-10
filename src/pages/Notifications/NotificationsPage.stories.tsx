import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { createMockNotifications } from '@/mocks/notifications'
import NotificationsPage from './NotificationsPage'

// 스냅샷이 날짜에 따라 바뀌지 않도록 기준 시각을 고정한다
const NOW = new Date('2026-11-10T12:00:00Z').getTime()

const meta = {
  title: 'Pages/Notifications',
  component: NotificationsPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    notifications: createMockNotifications(NOW),
    serverTime: new Date(NOW).toISOString(),
    hasMore: false,
    loadingMore: false,
    onBack: fn(),
    onNotificationClick: fn(),
    onRetry: fn(),
    onLoadMore: fn(),
    onTabChange: fn(),
  },
  // 알림을 누르면 읽음으로 바뀌도록 목록을 상태로 관리
  render: function Render(args) {
    const [notifications, setNotifications] = useState(args.notifications)
    return (
      <NotificationsPage
        {...args}
        notifications={notifications}
        onNotificationClick={(notification) => {
          args.onNotificationClick(notification)
          setNotifications((prev) =>
            prev.map((item) => (item.id === notification.id ? { ...item, readAt: item.readAt ?? args.serverTime } : item)),
          )
        }}
      />
    )
  },
} satisfies Meta<typeof NotificationsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { notifications: [] },
}

export const Loading: Story = {
  args: { status: 'loading', notifications: [], serverTime: null },
}

export const LoadError: Story = {
  args: { status: 'error', notifications: [], serverTime: null },
}

export const HasMore: Story = {
  args: { hasMore: true },
}
