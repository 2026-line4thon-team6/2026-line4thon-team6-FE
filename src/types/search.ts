import type { Coordinate } from './route'

export interface SearchHistoryItem {
  id: string
  query: string
  searchedAt: string
}

// 주소를 못 찾으면 available=false, address · region은 null
export interface ReverseGeocode {
  coordinate: Coordinate
  address: string | null
  region: string | null
  available: boolean
}
