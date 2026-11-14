import type { SearchPlacesParams } from '@/api/search'
import type { ApiResponse, CursorPage } from '@/types/api'
import type { PlaceCategory, PlaceSummary } from '@/types/place'
import type { Coordinate } from '@/types/route'
import type { ReverseGeocode, SearchHistoryItem } from '@/types/search'
import { createMeta, distanceBetween, mockApiError, paginate } from './utils'

// 장소 · 최근 검색어는 Figma 검색 화면(289:20830, 289:20892) 내용

// Figma '내 위치 (서초구 서초동)'
export const MOCK_CURRENT_COORDINATE: Coordinate = { latitude: 37.4837, longitude: 127.0324 }

const AVERAGE_SPEED_MPS = 50_000 / 3600

interface SearchPlaceSeed {
  name: string
  region: string
  address: string
  coordinate: Coordinate
  category: PlaceCategory
}

const PLACES: SearchPlaceSeed[] = [
  {
    name: '서울 반포 한강공원',
    region: '서울 서초구',
    address: '서울 서초구 신반포로11길 40',
    coordinate: { latitude: 37.5103, longitude: 126.9955 },
    category: 'NIGHT_VIEW',
  },
  {
    name: '서울 이촌 한강공원',
    region: '서울 용산구',
    address: '서울 용산구 이촌로72길 62',
    coordinate: { latitude: 37.5172, longitude: 126.9707 },
    category: 'NATURE',
  },
  {
    name: '서울 뚝섬 한강공원',
    region: '서울 광진구',
    address: '서울 광진구 강변북로 139',
    coordinate: { latitude: 37.5296, longitude: 127.0697 },
    category: 'NATURE',
  },
  {
    name: '서울 잠실 한강공원',
    region: '서울 송파구',
    address: '서울 송파구 한가람로 65',
    coordinate: { latitude: 37.5179, longitude: 127.0857 },
    category: 'NATURE',
  },
  {
    name: '서울 여의도 한강공원',
    region: '서울 영등포구',
    address: '서울 영등포구 여의동로 330',
    coordinate: { latitude: 37.5284, longitude: 126.9343 },
    category: 'NIGHT_VIEW',
  },
  {
    name: '서울 광나루 한강공원',
    region: '서울 강동구',
    address: '서울 강동구 선사로 83-66',
    coordinate: { latitude: 37.5466, longitude: 127.1206 },
    category: 'NATURE',
  },
  {
    name: '남양주 북한강 카페거리',
    region: '경기 남양주시',
    address: '경기 남양주시 조안면 북한강로',
    coordinate: { latitude: 37.5965, longitude: 127.326 },
    category: 'NEARBY_CAFE',
  },
  {
    name: '강릉 헌화로',
    region: '강원 강릉시',
    address: '강원 강릉시 강동면 헌화로',
    coordinate: { latitude: 37.7088, longitude: 129.0114 },
    category: 'SEA',
  },
  {
    name: '포천 산정호수',
    region: '경기 포천시',
    address: '경기 포천시 영북면 산정호수로411번길',
    coordinate: { latitude: 38.0644, longitude: 127.3124 },
    category: 'NATURE',
  },
  {
    name: '시흥 오이도',
    region: '경기 시흥시',
    address: '경기 시흥시 오이도로',
    coordinate: { latitude: 37.3456, longitude: 126.6878 },
    category: 'SEA',
  },
]

// '한강 공원'으로도 '한강공원'을 찾도록 공백을 무시한다
const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

export async function mockSearchPlaces({
  q,
  coordinate,
  cursor,
  limit = 20,
}: SearchPlacesParams): Promise<ApiResponse<CursorPage<PlaceSummary>>> {
  const keyword = normalize(q)
  if (!keyword || q.length > 100) throw mockApiError(422, 'VALIDATION_FAILED', '검색어는 1~100자로 입력해 주세요.')

  const matched = PLACES.map((seed, index): PlaceSummary => {
    const distanceMeters = coordinate ? distanceBetween(coordinate, seed.coordinate) : null
    return {
      id: `plc_search_${index + 1}`,
      ...seed,
      thumbnailUrl: null,
      hashtags: [],
      estimatedDurationSeconds: distanceMeters === null ? null : Math.round((distanceMeters * 1.3) / AVERAGE_SPEED_MPS),
      distanceMeters,
      isFavorite: false,
    }
  })
    .filter((place) => normalize(place.name).includes(keyword) || normalize(place.address).includes(keyword))
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))

  return { data: paginate(matched, cursor, limit), meta: createMeta() }
}

// Figma의 중복 항목(북한강 카페거리)은 명세상 하나만 남으므로 '시흥 오이도'로 바꿨다
const createHistory = (): SearchHistoryItem[] => [
  { id: 'srch_mock_1', query: '서울 반포 한강공원', searchedAt: '2026-10-25T09:00:00Z' },
  { id: 'srch_mock_2', query: '남양주 북한강 카페거리', searchedAt: '2026-10-23T11:00:00Z' },
  { id: 'srch_mock_3', query: '강릉 헌화로', searchedAt: '2026-10-23T08:00:00Z' },
  { id: 'srch_mock_4', query: '포천 산정호수', searchedAt: '2026-10-22T10:00:00Z' },
  { id: 'srch_mock_5', query: '시흥 오이도', searchedAt: '2026-10-20T07:00:00Z' },
]

const MAX_HISTORY = 30
let history = createHistory()
let historyCount = history.length

export function resetMockSearchHistory() {
  history = createHistory()
  historyCount = history.length
}

export async function mockGetSearchHistory(): Promise<ApiResponse<SearchHistoryItem[]>> {
  return { data: [...history], meta: createMeta() }
}

export async function mockSaveSearchHistory(query: string): Promise<ApiResponse<SearchHistoryItem>> {
  const trimmed = query.trim().replace(/\s+/g, ' ')
  if (!trimmed || trimmed.length > 100) {
    throw mockApiError(422, 'VALIDATION_FAILED', '검색어는 1~100자로 입력해 주세요.')
  }

  const meta = createMeta()
  const existing = history.find((item) => item.query === trimmed)
  const item: SearchHistoryItem = {
    id: existing?.id ?? `srch_mock_${++historyCount}`,
    query: trimmed,
    searchedAt: meta.serverTime,
  }
  history = [item, ...history.filter((entry) => entry.id !== item.id)].slice(0, MAX_HISTORY)
  return { data: item, meta }
}

export async function mockDeleteSearchHistory(historyId: string): Promise<void> {
  if (!history.some((item) => item.id === historyId)) {
    throw mockApiError(404, 'RESOURCE_NOT_FOUND', '최근 검색어를 찾을 수 없어요.')
  }
  history = history.filter((item) => item.id !== historyId)
}

// 한국 밖 좌표는 주소 없음, 그 외는 모두 '서초구 서초동'
export async function mockReverseGeocode(coordinate: Coordinate): Promise<ApiResponse<ReverseGeocode>> {
  const inKorea =
    coordinate.latitude >= 33 && coordinate.latitude <= 39 && coordinate.longitude >= 124 && coordinate.longitude <= 132
  return {
    data: inKorea
      ? { coordinate, address: '서울 서초구 서초동', region: '서울 서초구', available: true }
      : { coordinate, address: null, region: null, available: false },
    meta: createMeta(),
  }
}
