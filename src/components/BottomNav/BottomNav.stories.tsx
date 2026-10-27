import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import BottomNav, { type NavTab } from './BottomNav'

const meta = {
  title: 'Components/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    active: 'home',
    onChange: fn(),
    onDriveClick: fn(),
  },
  argTypes: {
    active: { control: 'inline-radio', options: ['home', 'map', 'studio', 'my'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390, margin: '40px auto 0' }}>
        <Story />
      </div>
    ),
  ],
  // 탭을 누르면 active 값이 바뀌도록 args와 연결
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <BottomNav
        {...args}
        onChange={(tab: NavTab) => {
          args.onChange(tab)
          updateArgs({ active: tab })
        }}
      />
    )
  },
} satisfies Meta<typeof BottomNav>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {}

export const Map: Story = {
  args: { active: 'map' },
}

export const Studio: Story = {
  args: { active: 'studio' },
}

export const My: Story = {
  args: { active: 'my' },
}
