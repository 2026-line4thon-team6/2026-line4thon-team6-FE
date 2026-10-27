import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import LikeButton from './LikeButton'

const meta = {
  title: 'Components/LikeButton',
  component: LikeButton,
  tags: ['autodocs'],
  globals: {
    backgrounds: { value: 'photo' },
  },
  args: {
    liked: false,
    size: 'sm',
    onToggle: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
  },
  // 클릭하면 liked 값이 바뀌도록 args와 연결
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <LikeButton
        {...args}
        onToggle={(liked) => {
          args.onToggle(liked)
          updateArgs({ liked })
        }}
      />
    )
  },
} satisfies Meta<typeof LikeButton>

export default meta
type Story = StoryObj<typeof meta>

// 스팟 카드 위
export const Small: Story = {}

export const SmallLiked: Story = {
  args: { liked: true },
}

// 상세 페이지 상단 글래스 버튼
export const Large: Story = {
  args: { size: 'lg' },
}

export const LargeLiked: Story = {
  args: { size: 'lg', liked: true },
}
