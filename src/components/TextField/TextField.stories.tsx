import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import TextField from './TextField'

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    placeholder: '예시: 우리의 첫 바다 드라이브',
    'aria-label': '드라이브명',
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: { defaultValue: '우리의 첫 바다 드라이브' },
}
