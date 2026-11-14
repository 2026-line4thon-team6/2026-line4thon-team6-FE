import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import SearchResultItem from './SearchResultItem'

const MOCK_PLACES = [
  { id: 1, name: '서울 반포 한강공원', distance: '3.2km', address: '서울 서초구 신반포로11길 40' },
  { id: 2, name: '서울 이촌 한강공원', distance: '5.1km', address: '서울 용산구 이촌로72길 62' },
  { id: 3, name: '서울 뚝섬 한강공원', distance: '7.8km', address: '서울 광진구 강변북로 139' },
  { id: 4, name: '서울 잠실 한강공원', distance: '8.1km', address: '서울 송파구 한가람로 65' },
]

const meta = {
  title: 'Components/DriveMode/SearchResultItem',
  component: SearchResultItem,
  tags: ['autodocs'],
  args: {
    ...MOCK_PLACES[0],
    keyword: '한강공원',
    onSelect: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['place', 'restArea'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchResultItem>

export default meta
type Story = StoryObj<typeof meta>

// 목적지 검색 결과
export const Place: Story = {}

// 휴게소 검색 결과 (주소 대신 고속도로 이름)
export const RestArea: Story = {
  args: {
    variant: 'restArea',
    name: '시흥하늘휴게소',
    keyword: '시흥하늘',
    distance: '3.2km',
    address: '수도권제1순환고속도로',
  },
}

// 위치 권한이 없어 거리를 모를 때
export const NoDistance: Story = {
  args: { distance: null },
}

// 장소 검색 화면의 결과 목록
export const List: Story = {
  render: (args) => (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {MOCK_PLACES.map(({ id, ...place }) => (
        <li key={id}>
          <SearchResultItem {...args} {...place} />
        </li>
      ))}
    </ul>
  ),
}
