import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { MOCK_SPOTS } from '@/mocks/home'
import type { PlaceCategory, PlaceSummary } from '@/types/place'
import FavoritesPage from './FavoritesPage'

// Figma 시안의 바다 카테고리 찜 3곳
const SEA_PLACES: PlaceSummary[] = MOCK_SPOTS.filter((spot) => spot.categoryId === 1).map((spot) => ({
  id: String(spot.id),
  name: spot.name,
  region: spot.region,
  address: spot.region,
  coordinate: { latitude: 37.3456, longitude: 126.6878 },
  thumbnailUrl: spot.imageUrl ?? null,
  category: 'SEA',
  hashtags: spot.tags,
  estimatedDurationSeconds: { 1: 3600, 2: 10800, 3: 4200 }[spot.id] ?? 3600,
  distanceMeters: null,
  isFavorite: true,
}))

const meta = {
  title: 'Pages/Archive/Favorites',
  component: FavoritesPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    places: SEA_PLACES,
    category: 'SEA',
    onBack: fn(),
    onRetry: fn(),
    onSelectCategory: fn(),
    onFavoriteToggle: fn(),
    onPlaceClick: fn(),
  },
  render: function Render(args) {
    const [category, setCategory] = useState<PlaceCategory | null>(args.category)
    const [places, setPlaces] = useState(args.places)
    return (
      <FavoritesPage
        {...args}
        category={category}
        places={places}
        onSelectCategory={(next) => {
          args.onSelectCategory(next)
          setCategory((prev) => (prev === next ? null : next))
        }}
        onFavoriteToggle={(placeId, favorite) => {
          args.onFavoriteToggle(placeId, favorite)
          setPlaces((prev) => prev.map((place) => (place.id === placeId ? { ...place, isFavorite: favorite } : place)))
        }}
      />
    )
  },
} satisfies Meta<typeof FavoritesPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: My_UI > 찜한 드라이브
export const Default: Story = {}

export const Empty: Story = {
  args: { places: [], category: null },
}

export const EmptyCategory: Story = {
  args: { places: [], category: 'CAR_CAMPING' },
}

export const Loading: Story = {
  args: { status: 'loading', places: [] },
}

export const LoadError: Story = {
  args: { status: 'error', places: [] },
}
