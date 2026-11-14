import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ActiveDriveBanner from './ActiveDriveBanner'

const meta = {
  title: 'Components/ActiveDriveBanner',
  component: ActiveDriveBanner,
  args: { onClick: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 348 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActiveDriveBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
