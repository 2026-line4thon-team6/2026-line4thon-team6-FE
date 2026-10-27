import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import GlassIconButton from './GlassIconButton'

const meta = {
  title: 'Components/GlassIconButton',
  component: GlassIconButton,
  tags: ['autodocs'],
  globals: {
    // 사진 위에 올라가는 버튼이라 어두운 배경에서 확인
    backgrounds: { value: 'photo' },
  },
  args: { onClick: fn() },
  argTypes: {
    icon: { control: 'inline-radio', options: ['back', 'share'] },
  },
} satisfies Meta<typeof GlassIconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Back: Story = {
  args: { icon: 'back', 'aria-label': '뒤로가기' },
}

export const Share: Story = {
  args: { icon: 'share', 'aria-label': '공유하기' },
}
