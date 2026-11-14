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
    icon: { control: 'inline-radio', options: ['back', 'share', 'close', 'locate', 'exit'] },
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

export const Close: Story = {
  args: { icon: 'close', 'aria-label': '닫기' },
}

export const Locate: Story = {
  args: { icon: 'locate', 'aria-label': '현재 위치로 이동' },
}

export const Exit: Story = {
  args: { icon: 'exit', 'aria-label': '드라이브 나가기' },
}
