import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import BottomCTAButton from './BottomCTAButton'

const meta = {
  title: 'Components/BottomCTAButton',
  component: BottomCTAButton,
  tags: ['autodocs'],
  args: {
    children: '경로 설정하기',
    disabled: false,
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomCTAButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}
