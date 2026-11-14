import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RouteSearchButton from './RouteSearchButton'

const meta = {
  title: 'Components/DriveMode/RouteSearchButton',
  component: RouteSearchButton,
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof RouteSearchButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
