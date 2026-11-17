import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import DriveEndModal from './DriveEndModal'

const meta = {
  title: 'Pages/Drive/DriveEndModal',
  component: DriveEndModal,
  parameters: { layout: 'fullscreen' },
  args: { busy: false, onRecord: fn(), onSkip: fn(), onEditRoute: fn(), onClose: fn() },
} satisfies Meta<typeof DriveEndModal>

export default meta
type Story = StoryObj<typeof meta>

// Figma 1046:10305 (드라이브 마치기 · 설명형 + 텍스트 링크)
export const Default: Story = {}

// 드라이브를 마치는 중 (버튼 막힘)
export const Ending: Story = { args: { busy: true } }
