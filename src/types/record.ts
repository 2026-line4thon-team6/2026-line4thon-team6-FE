// API 명세의 기록 지도 스키마 그대로 (GET /records/map)
export interface Coordinate {
  latitude: number
  longitude: number
}

export interface RecordDestination {
  placeId: string | null // 자유 좌표 목적지면 null
  name: string
  address: string | null
  coordinate: Coordinate | null // 좌표가 없는 목적지는 지도에 나오지 않는다
}

// 같은 목적지에서 가장 최근에 완료한 카드
export interface RecordMapCard {
  cardId: string // 서버 발급 불투명 ID
  driveId: string
  title: string
  driveDate: string // YYYY-MM-DD (Asia/Seoul)
  destination: RecordDestination | null // 목적지를 정하지 않았으면 null
  // 첫 사진(10분짜리 서명 링크). 사진이 없는 기록은 null → FE가 공통 기본 일러스트를 보여 준다 (D15, RecordPhoto)
  thumbnailUrl: string | null
  distanceMeters: number
  activeDurationSeconds: number
  completedAt: string // UTC RFC3339
}

export interface RecordMapMarker {
  groupKey: string // 목적지 묶음 키. 예) place:plc_01
  coordinate: Coordinate
  latestCard: RecordMapCard
  recordCount: number // 화면의 +N은 recordCount - 1
}

export interface RecordMap {
  totalCount: number
  markers: RecordMapMarker[]
  nextCursor: string | null
  hasMore: boolean
}

// 지도 화면 범위 (WGS84)
export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

// GET /records 의 한 줄. 마커의 latestCard와 같은 형식이다
export type RecordSummary = RecordMapCard

export interface RecordPage {
  totalCount: number // 조건과 관계없는 전체 완료 기록 수 (상단 '총 N번')
  filteredCount: number // 검색어 · 날짜 조건을 적용한 수
  items: RecordSummary[] // 최신 driveDate 순
  nextCursor: string | null
  hasMore: boolean
}

// GET /records/calendar — 그 달에 기록이 있는 날짜만 담긴다. 없는 날짜는 달력에서 고를 수 없다
export interface RecordCalendarDay {
  date: string // YYYY-MM-DD (Asia/Seoul)
  count: number
}

export interface RecordCalendar {
  month: string // YYYY-MM
  days: RecordCalendarDay[]
}
