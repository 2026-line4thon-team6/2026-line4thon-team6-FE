import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_SPOTS } from '@/mocks/home'
import SpotCard from './SpotCard'

const meta = {
  title: 'Components/SpotCard',
  component: SpotCard,
  tags: ['autodocs'],
  args: {
    spot: MOCK_SPOTS[0],
    onClick: fn(),
    onLikeToggle: fn(),
  },
} satisfies Meta<typeof SpotCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NotLiked: Story = {
  args: { spot: MOCK_SPOTS[1] },
}

export const LongName: Story = {
  args: { spot: MOCK_SPOTS[2] },
}

// 태그가 카드 폭을 넘으면 잘린다
export const ManyTags: Story = {
  args: { spot: MOCK_SPOTS[3] },
}

// 홈 큐레이션 가로 스크롤 목록
export const List: Story = {
  render: function Render() {
    const [spots, setSpots] = useState(MOCK_SPOTS)
    return (
      <div style={{ display: 'flex', gap: 15, width: 350, padding: 6, overflowX: 'auto' }}>
        {spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onLikeToggle={(id, liked) =>
              setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, liked } : s)))
            }
          />
        ))}
      </div>
    )
  },
}
