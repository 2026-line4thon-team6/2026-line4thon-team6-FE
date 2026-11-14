import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import DriveTitleBar from './DriveTitleBar'

const meta = {
  title: 'Components/DriveMode/DriveTitleBar',
  component: DriveTitleBar,
  tags: ['autodocs'],
  args: {
    title: '우리의 첫 바다 드라이브',
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 284 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DriveTitleBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 드라이브명이 길면 말줄임
export const LongTitle: Story = {
  args: { title: '연인과 함께 떠나는 노을 맛집 해안도로 드라이브 코스' },
}
