import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_COUPLE, MOCK_ME } from '@/mocks/couples'
import CouplePage from './CouplePage'

// 저장 결과: null이면 성공, 문자열이면 실패 안내
const resolved = (value: string | null) => fn(async (): Promise<string | null> => value)

const meta = {
  title: 'Pages/Couple',
  component: CouplePage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    couple: MOCK_COUPLE.couple,
    me: MOCK_ME,
    inviteCode: 'jsd82nk9',
    today: '2026-11-13',
    onBack: fn(),
    onRetry: fn(),
    onChangeStartDate: resolved(null),
    onRenameMascot: resolved(null),
    onUpdateProfile: resolved(null),
    onCopyInviteCode: fn(async () => {}),
    onDisconnect: resolved(null),
    onDisconnected: fn(),
  },
} satisfies Meta<typeof CouplePage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: My_UI > 커플 페이지 (행을 누르면 시작일 시트 · 붕붕이명 · 편집 팝업 · 연결 끊기 시트가 열린다)
export const Default: Story = {}

// 진행 중인 드라이브가 있어 연결을 해제할 수 없을 때
export const DisconnectBlocked: Story = {
  args: { onDisconnect: resolved('진행 중인 드라이브를 먼저 끝낸 뒤 해제해 주세요.') },
}

export const NoInviteCode: Story = {
  args: { inviteCode: null },
}

export const Unlinked: Story = {
  args: { status: 'unlinked', couple: null },
}

export const LoadError: Story = {
  args: { status: 'error', couple: null, me: null },
}
