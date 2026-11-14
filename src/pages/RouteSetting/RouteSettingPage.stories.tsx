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

export const RoutePreview: Story = {
  args: { query: '서울 반포 한강공원', route: ROUTE },
}
