import type { Coordinate } from './route'

import type { PlaceSummary } from './place'

export interface SearchPlace extends PlaceSummary {
  canSave: boolean
}

export interface SearchHistoryItem {
  id: string
  query: string
  searchedAt: string
}

export interface ReverseGeocode {
  coordinate: Coordinate
  address: string | null
  region: string | null
  available: boolean
}
