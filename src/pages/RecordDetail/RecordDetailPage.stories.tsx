import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_ME_ID, mockFetchCard } from '@/mocks/cards'
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
    myUserId: MOCK_ME_ID,
    myNickname: '민준',
    partnerNickname: '민지',
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

// 수정 기간이 끝났는데 비어 있는 소감 칸: 내 칸 '기록을 작성하지 않았어요 :)', 상대방 칸 '상대방이 기록을 남기지 않았어요 :)'
export const EmptyReflections: Story = {
  args: { card: { ...TWO_PHOTOS, reflections: [] } },
}

export const NotFound: Story = {
  args: { status: 'notFound', card: null },
}
