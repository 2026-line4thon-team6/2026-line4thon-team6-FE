import type { Meta, StoryObj } from '@storybook/react-vite'
import DriveStats from './DriveStats'

const meta = {
  title: 'Components/DriveMode/DriveStats',
  component: DriveStats,
  tags: ['autodocs'],
  globals: {
    backgrounds: { value: 'photo' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
  args: { items: [] },
} satisfies Meta<typeof DriveStats>

export default meta
type Story = StoryObj<typeof meta>

export const BeforeDestination: Story = {
  args: {
    items: [
      { label: '주행 시간', value: '-분 -초' },
      { label: '이동 거리', value: '-km' },
      { label: '예상 도착 시간', value: '-시 -분' },
    ],
  },
}

export const RoutePreview: Story = {
  args: {
    items: [
      { label: '예상 주행 시간', value: '1시간 20분' },
      { label: '이동 거리', value: '24.6km' },
      { label: '예상 도착 시간', value: '19시 47분' },
    ],
  },
}
