import type { Meta, StoryObj } from '@storybook/react-vite'
import DriveStats from './DriveStats'

const meta = {
  title: 'Components/DriveMode/DriveStats',
  component: DriveStats,
  tags: ['autodocs'],
  globals: {
    // 지도 위에 올라가는 글래스 카드라 어두운 배경에서 확인
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

// 01 첫 진입: 목적지를 정하기 전이라 비워서 표시
export const BeforeDestination: Story = {
  args: {
    items: [
      { label: '주행 시간', value: '-분 -초' },
      { label: '이동 거리', value: '-km' },
      { label: '예상 도착 시간', value: '-시 -분' },
    ],
  },
}

// 경로 설정하기: 경로 미리보기 값
export const RoutePreview: Story = {
  args: {
    items: [
      { label: '예상 주행 시간', value: '1시간 20분' },
      { label: '이동 거리', value: '24.6km' },
      { label: '예상 도착 시간', value: '19시 47분' },
    ],
  },
}
