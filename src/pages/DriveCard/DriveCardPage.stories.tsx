import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_CARD_DRIVE_ID, MOCK_ME_ID, mockFetchDriveCard, resetMockCards } from '@/mocks/cards'
import type { Card } from '@/types/card'
import DriveCardPage from './DriveCardPage'

resetMockCards()
const { data: EMPTY_CARD } = await mockFetchDriveCard(MOCK_CARD_DRIVE_ID)

// Figma '카드 작성 완료': 사진 2장 + 연인(운전자)의 소감
const FILLED_CARD: Card = {
  ...EMPTY_CARD,
  status: 'DRAFT',
  photos: [1, 2].map((index) => ({
    mediaId: `med_${index}`,
    url: `/mocks/cards/photo-${index}.webp`,
    urlExpiresAt: '2026-11-04T00:00:00Z',
    order: index - 1,
  })),
}

const meta = {
  title: 'Pages/DriveCard',
  component: DriveCardPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    card: EMPTY_CARD,
    myRole: 'PASSENGER',
    myText: '',
    partnerText: null,
    canSave: false,
    busy: false,
    error: null,
    onMyTextChange: fn(),
    onLeave: fn(),
    onRetry: fn(),
    onAddPhotos: fn(),
    onRemovePhoto: fn(),
    onSwapPhotos: fn(),
    onSave: fn(),
  },
} satisfies Meta<typeof DriveCardPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: 카드 작성 (사진 · 소감 없음)
export const Empty: Story = {}

// Figma: 카드 작성 완료
export const Filled: Story = {
  args: {
    card: FILLED_CARD,
    myText: '운전하느라 조금 힘들었지만 노을은 진짜 예뻤다 ㅎㅎ',
    partnerText: '운전하느라 조금 힘들었지만 노을은 진짜 예뻤다 ㅎㅎ',
    canSave: true,
  },
}

export const OnePhoto: Story = {
  args: {
    card: { ...FILLED_CARD, photos: FILLED_CARD.photos.slice(0, 1) },
    canSave: true,
  },
}

export const Saving: Story = {
  args: { ...Filled.args, busy: true },
}

export const WithError: Story = {
  args: { error: '사진은 2장까지 넣을 수 있어요.' },
}

export const Unavailable: Story = {
  args: { status: 'unavailable', card: null },
}

export const LoadError: Story = {
  args: { status: 'error', card: null },
}

// 내가 운전자인 경우 (MOCK_ME_ID가 운전자)
export const AsDriver: Story = {
  args: {
    card: { ...EMPTY_CARD, driverUserId: MOCK_ME_ID },
    myRole: 'DRIVER',
    partnerText: '노을은 진짜 예뻤다 ㅎㅎ',
    canSave: true,
  },
}
