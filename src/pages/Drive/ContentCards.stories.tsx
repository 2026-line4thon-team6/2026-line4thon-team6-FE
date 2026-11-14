import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ContentCards from './ContentCards'

const meta = {
  title: 'Pages/Drive/ContentCards',
  component: ContentCards,
  args: { onPlaylistClick: fn(), onContentClick: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
