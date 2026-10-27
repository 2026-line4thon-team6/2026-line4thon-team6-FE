import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_CATEGORIES } from '@/mocks/home'
import CategoryChip from './CategoryChip'

const [sea] = MOCK_CATEGORIES

const meta = {
  title: 'Components/CategoryChip',
  component: CategoryChip,
  tags: ['autodocs'],
  args: {
    icon: sea.iconUrl,
    label: sea.name,
    selected: false,
    onClick: fn(),
  },
} satisfies Meta<typeof CategoryChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true },
}

// 홈 '스마트 탐색 & 큐레이션' 필터 목록 (백엔드 카테고리 목업)
export const List: Story = {
  render: function Render() {
    const [selectedId, setSelectedId] = useState(MOCK_CATEGORIES[0].id)
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {MOCK_CATEGORIES.map(({ id, name, iconUrl }) => (
          <CategoryChip
            key={id}
            icon={iconUrl}
            label={name}
            selected={id === selectedId}
            onClick={() => setSelectedId(id)}
          />
        ))}
      </div>
    )
  },
}
