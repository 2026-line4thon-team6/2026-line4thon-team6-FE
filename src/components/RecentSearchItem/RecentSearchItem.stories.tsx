import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RecentSearchItem from './RecentSearchItem'

const MOCK_RECENT_SEARCHES = [
  { id: 1, keyword: '서울 반포 한강공원', date: '10.25' },
  { id: 2, keyword: '남양주 북한강 카페거리', date: '10.23' },
  { id: 3, keyword: '강릉 헌화로', date: '10.23' },
  { id: 4, keyword: '포천 산정호수', date: '10.22' },
  { id: 5, keyword: '남양주 북한강 카페거리', date: '10.20' },
]

const meta = {
  title: 'Components/DriveMode/RecentSearchItem',
  component: RecentSearchItem,
  tags: ['autodocs'],
  args: {
    keyword: MOCK_RECENT_SEARCHES[0].keyword,
    date: MOCK_RECENT_SEARCHES[0].date,
    onSelect: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 339 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecentSearchItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 장소 검색 화면의 최근 검색어 목록
export const List: Story = {
  render: (args) => (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {MOCK_RECENT_SEARCHES.map(({ id, keyword, date }) => (
        <li key={id}>
          <RecentSearchItem {...args} keyword={keyword} date={date} />
        </li>
      ))}
    </ul>
  ),
}
