import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFetchPlaceDetail } from '@/mocks/places'
import PlaceDetailPage from './PlaceDetailPage'

const { data: OIDO } = await mockFetchPlaceDetail('1')
const { data: HEONHWARO } = await mockFetchPlaceDetail('2')

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const meta = {
  title: 'Pages/PlaceDetail',
  component: PlaceDetailPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    detail: OIDO,
    partnerNickname: '민지',
    onBack: fn(),
    onRetry: fn(),
    onFavoriteToggle: fn(),
    onStartDrive: fn(),
    getShareUrl: async () => 'https://bunbungus.app/places/siheung-oido',
    onCopyLink: fn(),
    onShareChannel: fn(),
    onSendToPartner: () => wait(600),
    onConnectRequired: fn(),
  },
  // 하트를 누르면 실제로 토글되도록 상세 데이터를 상태로 관리
  render: function Render(args) {
    const [detail, setDetail] = useState(args.detail)
    return (
      <PlaceDetailPage
        {...args}
        detail={detail}
        onFavoriteToggle={(favorite) => {
          args.onFavoriteToggle(favorite)
          setDetail((prev) => (prev ? { ...prev, place: { ...prev.place, isFavorite: favorite } } : prev))
        }}
      />
    )
  },
} satisfies Meta<typeof PlaceDetailPage>

export default meta
type Story = StoryObj<typeof meta>

// 공유 아이콘 · '연인에게 보내기'를 눌러 바텀시트와 팝업을 확인할 수 있다
export const Default: Story = {}

// 위치를 몰라 예상 시간 · 경로가 없고, 사진이 1장뿐인 장소
export const MinimalInfo: Story = {
  args: {
    detail: { ...HEONHWARO, place: { ...HEONHWARO.place, estimatedDurationSeconds: null } },
  },
}

// 연인과 연결되지 않은 사용자 ('연인에게 보내기'를 눌러도 팝업이 뜨지 않는다)
export const NotConnected: Story = {
  args: { partnerNickname: null },
}

export const SendFails: Story = {
  args: {
    onSendToPartner: async () => {
      await wait(600)
      throw new Error('전송 실패')
    },
  },
}

export const Loading: Story = {
  args: { status: 'loading', detail: null },
}

export const LoadError: Story = {
  args: { status: 'error', detail: null },
}
