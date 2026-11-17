import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_COUPLE } from '@/mocks/couples'
import MyPage from './MyPage'

const meta = {
  title: 'Pages/My',
  component: MyPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    couple: MOCK_COUPLE.couple,
    onProfileClick: fn(),
    onMenuClick: fn(),
    onLogout: fn(),
    onTabChange: fn(),
    onInstall: fn(),
    onWithdraw: fn(async () => 'redirecting' as const),
  },
} satisfies Meta<typeof MyPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: My_UI > 마이
export const Default: Story = {}

// 연인과 연결하기 전
export const Unlinked: Story = {
  args: { couple: null },
}

export const LoadError: Story = {
  args: { status: 'error', couple: null },
}

// 붕붕이명이 길 때
export const LongMascotName: Story = {
  args: {
    couple: MOCK_COUPLE.couple && { ...MOCK_COUPLE.couple, mascotName: '우리집귀염둥이붕붕이와함께' },
  },
}

// 앱 설치하기: 브라우저 설치 창을 바로 띄울 수 있을 때 (크롬 · 삼성 인터넷)
export const InstallPrompt: Story = {
  args: { installMode: 'prompt' },
}

// 앱 설치하기: 아이폰은 누르면 '공유 → 홈 화면에 추가' 안내 시트
export const InstallGuideIos: Story = {
  args: { installMode: 'ios' },
}

// 본인 확인 후 탈퇴하지 못하고 돌아온 경우 (백엔드가 아직 탈퇴를 열지 않음)
export const WithdrawFailed: Story = {
  args: { withdrawError: '지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.' },
}
