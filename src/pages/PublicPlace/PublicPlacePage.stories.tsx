import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFetchFavorites, mockFetchPublicPlace } from '@/mocks/places'
import PublicPlacePage from './PublicPlacePage'

// 목 장소 id는 브랜치마다 다를 수 있어 고정하지 않고, 목 저장소의 첫 장소를 쓴다
const { data: favorites } = await mockFetchFavorites()
const { data: PLACE } = await mockFetchPublicPlace(favorites.items[0].id)

const meta = {
  title: 'Pages/PublicPlace',
  component: PublicPlacePage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    place: PLACE,
    onRetry: fn(),
    onStart: fn(),
  },
} satisfies Meta<typeof PublicPlacePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 사진 · 소개가 없는 장소 (사진 자리에 코랄 배경)
export const NoPhotoNoIntroduction: Story = {
  args: { place: { ...PLACE, thumbnailUrl: null, introduction: null } },
}

export const Loading: Story = {
  args: { status: 'loading', place: null },
}

export const NotFound: Story = {
  args: { status: 'notFound', place: null },
}

export const LoadError: Story = {
  args: { status: 'error', place: null },
}
