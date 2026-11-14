import type { Coordinate } from './route'

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
