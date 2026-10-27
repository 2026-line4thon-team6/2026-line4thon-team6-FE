import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import CloseButton from './CloseButton'

const meta = {
  title: 'Components/CloseButton',
  component: CloseButton,
  tags: ['autodocs'],
  globals: {
    backgrounds: { value: 'white' },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof CloseButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
