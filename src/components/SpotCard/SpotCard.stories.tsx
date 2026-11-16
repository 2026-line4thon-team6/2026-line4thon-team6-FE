import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_PLACES } from '@/mocks/places'
import SpotCard from './SpotCard'

const meta = {
  title: 'Components/SpotCard',
  component: SpotCard,
  tags: ['autodocs'],
  args: {
    spot: MOCK_PLACES[0],
    onClick: fn(),
    onLikeToggle: fn(),
  },
} satisfies Meta<typeof SpotCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NotLiked: Story = {
  args: { spot: MOCK_PLACES[1] },
}

export const LongName: Story = {
  args: { spot: MOCK_PLACES[2] },
}

// 태그가 카드 폭을 넘으면 잘린다
export const ManyTags: Story = {
  args: { spot: { ...MOCK_PLACES[3], hashtags: ['도심드라이브', '서울', '야경', '데이트코스'] } },
}

// 서버가 소요 시간을 주지 않으면 지역만 보인다
export const NoDuration: Story = {
  args: { spot: { ...MOCK_PLACES[0], estimatedDurationSeconds: null } },
}

// 홈 큐레이션 가로 스크롤 목록
export const List: Story = {
  render: function Render() {
    const [spots, setSpots] = useState(MOCK_PLACES.slice(0, 3))
    return (
      <div style={{ display: 'flex', gap: 15, width: 350, padding: 6, overflowX: 'auto' }}>
        {spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onLikeToggle={(id, liked) =>
              setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, isFavorite: liked } : s)))
            }
          />
        ))}
      </div>
    )
  },
}
