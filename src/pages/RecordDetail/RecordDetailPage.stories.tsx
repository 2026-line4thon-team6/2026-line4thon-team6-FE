import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFetchCard } from '@/mocks/cards'
import RecordDetailPage from './RecordDetailPage'

// 목 기록: 자라섬(사진 2장), 몽산포(사진 1장)
const { data: TWO_PHOTOS } = await mockFetchCard('crd_01')
const { data: ONE_PHOTO } = await mockFetchCard('crd_03')

// 기록 지도 - 카드 상세 (Figma 284:15397)
const meta = {
  title: 'Pages/RecordDetail',
  component: RecordDetailPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    card: TWO_PHOTOS,
    onBack: fn(),
    onRetry: fn(),
    onDelete: fn(async () => 'deleted' as const),
    onPlaylistClick: fn(),
  },
} satisfies Meta<typeof RecordDetailPage>

export default meta
type Story = StoryObj<typeof meta>

export const TwoPhotos: Story = {}

// 사진이 1장이면 한 칸을 가득 채운다. 세로가 긴 사진도 214px 안에 잘라 넣어 아래 소감을 덮지 않는다
export const OnePhoto: Story = {
  args: { card: ONE_PHOTO },
}

export const NoPhotos: Story = {
  args: { card: { ...TWO_PHOTOS, photos: [] } },
}

export const NotFound: Story = {
  args: { status: 'notFound', card: null },
}
