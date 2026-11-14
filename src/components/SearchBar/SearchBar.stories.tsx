import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import SearchBar from './SearchBar'

const meta = {
  title: 'Components/DriveMode/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  args: {
    value: '',
    placeholder: '휴게소 이름을 검색해주세요.',
    'aria-label': '휴게소 검색',
    onValueChange: fn(),
    onSearch: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 310 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: { value: '시흥하늘휴게소' },
}

// 직접 입력해보기
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('')
    return <SearchBar {...args} value={value} onValueChange={setValue} />
  },
}
