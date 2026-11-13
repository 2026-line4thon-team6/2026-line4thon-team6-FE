import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import DateWheelPicker from './DateWheelPicker'

const meta = {
  title: 'Components/DateWheelPicker',
  component: DateWheelPicker,
  decorators: [
    (Story) => (
      <div style={{ width: 325 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    value: '2026-10-20',
    max: '2026-11-13',
    onChange: fn(),
  },
  // 고른 값이 바로 반영되도록 상태로 관리
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <DateWheelPicker
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next)
          setValue(next)
        }}
      />
    )
  },
} satisfies Meta<typeof DateWheelPicker>

export default meta
type Story = StoryObj<typeof meta>

// Figma: 커플 시작일 변경 바텀시트의 휠
export const Default: Story = {}

// 오늘이 속한 달: 오늘 이후 날짜는 흐리게 막힌다
export const NearMax: Story = {
  args: { value: '2026-11-10' },
}
