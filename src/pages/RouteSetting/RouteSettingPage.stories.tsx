import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockCreateRoute } from '@/mocks/routes'
import { MOCK_CURRENT_COORDINATE, mockGetSearchHistory, mockSearchPlaces } from '@/mocks/search'
import RouteSettingPage from './RouteSettingPage'

const { data: HISTORY } = await mockGetSearchHistory()
const { data: RESULTS } = await mockSearchPlaces({ q: '한강 공원', coordinate: MOCK_CURRENT_COORDINATE })
const { data: ROUTE } = await mockCreateRoute({
  origin: { placeId: null, name: '내 위치', address: '서울 서초구 서초동', coordinate: MOCK_CURRENT_COORDINATE },
  destination: { ...RESULTS.items[0], placeId: RESULTS.items[0].id },
})

const meta = {
  title: 'Pages/RouteSetting',
  component: RouteSettingPage,
  parameters: { layout: 'fullscreen' },
  args: {
    originAddress: '서울 서초구 서초동',
    query: '',
    history: HISTORY,
    results: null,
    route: null,
    routeStatus: 'idle',
    onQueryChange: fn(),
    onSearch: fn(),
    onRecentSelect: fn(),
    onRecentDelete: fn(),
    onResultSelect: fn(),
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof RouteSettingPage>

export default meta
type Story = StoryObj<typeof meta>

export const RecentSearches: Story = {}

export const Results: Story = {
  args: { query: '한강 공원', results: RESULTS.items },
}

export const NoResults: Story = {
  args: { query: '없는 장소', results: [] },
}

// 예상 도착 시간은 목 서버가 현재 시각으로 계산해 빌드마다 바뀐다 → Chromatic 비교가 흔들리지 않게 고정한다
// (Date 생성자의 지역 시각이라 어느 시간대에서 찍어도 '14시 30분')
export const RoutePreview: Story = {
  args: { query: '서울 반포 한강공원', route: { ...ROUTE, estimatedArrivalAt: new Date(2026, 10, 14, 14, 30).toISOString() } },
}
