import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RouteSearchBox from './RouteSearchBox'

const meta = {
  title: 'Components/DriveMode/RouteSearchBox',
  component: RouteSearchBox,
  tags: ['autodocs'],
  args: {
    originLabel: '내 위치',
    originDetail: '서초구 서초동',
    destination: '',
    onDestinationChange: fn(),
    onSearch: fn(),
    onAddWaypoint: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 284 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteSearchBox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: { destination: '서울 반포 한강 공원' },
}

// 입력하고 Enter로 검색
export const Interactive: Story = {
  render: function Render(args) {
    const [destination, setDestination] = useState('')
    return <RouteSearchBox {...args} destination={destination} onDestinationChange={setDestination} />
  },
}
