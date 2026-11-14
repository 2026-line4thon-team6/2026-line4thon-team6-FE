import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import LocationSearchButton from './LocationSearchButton'

const meta = {
  title: 'Components/DriveMode/LocationSearchButton',
  component: LocationSearchButton,
  tags: ['autodocs'],
  args: { onClick: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 289 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LocationSearchButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}
