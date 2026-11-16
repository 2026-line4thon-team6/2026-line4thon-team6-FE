import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PLACE_CATEGORIES } from '@/constants/placeCategories'
import type { PlaceCategory } from '@/types/place'
import CategoryChip from './CategoryChip'

const sea = PLACE_CATEGORIES.SEA
const CATEGORIES = Object.entries(PLACE_CATEGORIES) as [PlaceCategory, typeof sea][]

const meta = {
  title: 'Components/CategoryChip',
  component: CategoryChip,
  tags: ['autodocs'],
  args: {
    icon: sea.icon,
    label: sea.label,
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

// 홈 '스마트 탐색 & 큐레이션' 필터 목록
export const List: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<PlaceCategory>('SEA')
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {CATEGORIES.map(([value, { label, icon }]) => (
          <CategoryChip
            key={value}
            icon={icon}
            label={label}
            selected={value === selected}
            onClick={() => setSelected(value)}
          />
        ))}
      </div>
    )
  },
}
