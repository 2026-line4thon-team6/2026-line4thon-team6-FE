import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import Button from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: '드라이브 시작하기',
    variant: 'primary',
    size: 'md',
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['lg', 'md', 'sm'] },
    icon: { control: 'inline-radio', options: [undefined, 'car', 'letter'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 350 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// 홈 카드 CTA
export const Large: Story = {
  args: { size: 'lg', icon: 'car' },
}

// 상세 페이지 하단
export const MediumPrimary: Story = {
  args: { icon: 'car' },
  decorators: [(Story) => <div style={{ width: 165 }}><Story /></div>],
}

export const MediumSecondary: Story = {
  args: { variant: 'secondary', icon: 'letter', children: '연인에게 보내기' },
  decorators: [(Story) => <div style={{ width: 165 }}><Story /></div>],
}

// 모달
export const SmallPrimary: Story = {
  args: { size: 'sm', children: '보내기' },
  decorators: [(Story) => <div style={{ width: 196 }}><Story /></div>],
}

export const SmallSecondary: Story = {
  args: { size: 'sm', variant: 'secondary', children: '취소' },
  decorators: [(Story) => <div style={{ width: 96 }}><Story /></div>],
}

export const Disabled: Story = {
  args: { icon: 'car', disabled: true },
}

// 실제 화면 배치
export const DetailFooter: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
      <Button variant="secondary" icon="letter">연인에게 보내기</Button>
      <Button icon="car">드라이브 시작하기</Button>
    </div>
  ),
}

export const ModalFooter: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 8 }}>
      <Button variant="secondary" size="sm">취소</Button>
      <Button size="sm">보내기</Button>
    </div>
  ),
}
