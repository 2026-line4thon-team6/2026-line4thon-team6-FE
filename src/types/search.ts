import type { Coordinate } from './route'

import type { PlaceSummary } from './place'

// GET /places 결과. 카카오 검색 결과는 우리 장소가 아니라 canSave=false
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
