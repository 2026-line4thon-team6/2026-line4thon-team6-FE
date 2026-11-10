import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import HomePage from './HomePage'

const meta = {
  title: 'Pages/Home',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    home: MOCK_HOME,
    categories: MOCK_CATEGORIES,
    spots: MOCK_SPOTS,
    carConnected: true,
    onNotificationClick: fn(),
    onStartDrive: fn(),
    onSpotClick: fn(),
    onLikeToggle: fn(),
    onTabChange: fn(),
  },
  // 하트를 누르면 실제로 토글되도록 spots를 상태로 관리
  render: function Render(args) {
    const [spots, setSpots] = useState(args.spots)
    return (
      <HomePage
        {...args}
        spots={spots}
        onLikeToggle={(id, liked) => {
          args.onLikeToggle?.(id, liked)
          setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))
        }}
      />
    )
  },
} satisfies Meta<typeof HomePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 날씨·교통 정보를 불러오지 못했을 때는 '--'로 표시
export const ContextUnavailable: Story = {
  args: {
    home: {
      ...MOCK_HOME,
      unreadNotificationCount: 0,
      context: { weather: null, temperature: null, traffic: null, recommendedTheme: null },
    },
  },
}

export const CarDisconnected: Story = {
  args: { carConnected: false },
}

// 붕붕이 이름·닉네임이 길 때
export const LongNames: Story = {
  args: {
    home: { ...MOCK_HOME, nickname: '드라이브좋아', mascotName: '우리집귀염둥이붕붕이', daysTogether: 1234 },
  },
}
