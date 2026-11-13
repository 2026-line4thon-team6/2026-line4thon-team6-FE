import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { MOCK_RADIO_EPISODES } from '@/mocks/radio'
import RadioStoriesPage from './RadioStoriesPage'

const meta = {
  title: 'Pages/Archive/RadioStories',
  component: RadioStoriesPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    episodes: MOCK_RADIO_EPISODES,
    query: '',
    keyword: '',
    onBack: fn(),
    onRetry: fn(),
    onQueryChange: fn(),
    onStoryClick: fn(),
  },
  render: function Render(args) {
    const [query, setQuery] = useState(args.query)
    return (
      <RadioStoriesPage
        {...args}
        query={query}
        onQueryChange={(next) => {
          args.onQueryChange(next)
          setQuery(next)
        }}
      />
    )
  },
} satisfies Meta<typeof RadioStoriesPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: My_UI > 라디오 사연 보관함
export const Default: Story = {}

export const Empty: Story = {
  args: { episodes: [] },
}

export const NoSearchResult: Story = {
  args: { episodes: [], query: '고양이', keyword: '고양이' },
}

export const LoadError: Story = {
  args: { status: 'error', episodes: [] },
}
