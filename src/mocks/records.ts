import type { FetchRecordMapParams, FetchRecordsParams } from '@/api/records'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { RecordCalendar, RecordMap, RecordMapMarker, RecordPage, RecordSummary } from '@/types/record'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 기록 목 응답.
// Figma 기록 지도처럼 전국 10곳에 12번의 드라이브 기록을 만든다. 사진은 public/mocks/spots 를 쓴다
interface Seed {
  name: string
  address: string
  latitude: number
  longitude: number
  photo: string
  // 같은 목적지의 기록. 첫 번째가 가장 최근 기록이다
  drives: { title: string; driveDate: string }[]
}

const SEEDS: Seed[] = [
  { name: '가평 자라섬', address: '경기 가평군 가평읍', latitude: 37.8215, longitude: 127.5262, photo: 'jaraseom', drives: [{ title: '자라섬 캠핑 드라이브', driveDate: '2026-11-08' }] },
  {
    name: '시흥 오이도',
    address: '경기 시흥시 정왕동',
    latitude: 37.3456,
    longitude: 126.6878,
    photo: 'oido',
    drives: [
      { title: '오이도 노을 보러', driveDate: '2026-11-02' },
      { title: '우리의 첫 바다 드라이브', driveDate: '2026-09-27' },
    ],
  },
  { name: '태안 몽산포', address: '충남 태안군 남면', latitude: 36.6735, longitude: 126.2786, photo: 'mongsanpo', drives: [{ title: '몽산포 해변 산책', driveDate: '2026-10-24' }] },
  { name: '양평 두물머리', address: '경기 양평군 양서면', latitude: 37.5337, longitude: 127.3149, photo: 'dumulmeori', drives: [{ title: '두물머리 아침 드라이브', driveDate: '2026-10-18' }] },
  {
    name: '강릉 헌화로',
    address: '강원 강릉시 강동면',
    latitude: 37.7155,
    longitude: 129.0124,
    photo: 'heonhwaro',
    drives: [
      { title: '헌화로 바다 드라이브', driveDate: '2026-10-11' },
      { title: '가을바다 힐링 드라이브', driveDate: '2026-09-13' },
    ],
  },
  { name: '포천 산정호수', address: '경기 포천시 영북면', latitude: 38.0697, longitude: 127.3136, photo: 'sanjeong-lake', drives: [{ title: '산정호수 단풍길', driveDate: '2026-10-03' }] },
  { name: '군산 새만금', address: '전북 군산시 옥도면', latitude: 35.8228, longitude: 126.5288, photo: 'songdo', drives: [{ title: '새만금 방조제 달리기', driveDate: '2026-09-20' }] },
  { name: '여수 돌산', address: '전남 여수시 돌산읍', latitude: 34.7271, longitude: 127.7449, photo: 'banpo', drives: [{ title: '여수 밤바다', driveDate: '2026-09-06' }] },
  { name: '남해 독일마을', address: '경남 남해군 삼동면', latitude: 34.7988, longitude: 128.0414, photo: 'eurwangni', drives: [{ title: '남해 노을 드라이브', driveDate: '2026-08-30' }] },
  { name: '부산 광안리', address: '부산 수영구 광안동', latitude: 35.1532, longitude: 129.1186, photo: 'namsan', drives: [{ title: '광안대교 야경', driveDate: '2026-08-15' }] },
]

const byLatest = (a: RecordSummary, b: RecordSummary) =>
  b.driveDate.localeCompare(a.driveDate) || b.cardId.localeCompare(a.cardId)

// 목 서버에서 삭제한 카드. 지운 기록은 목록 · 지도 · 달력에서 빠진다
const deletedCardIds = new Set<string>()

export function markMockRecordDeleted(cardId: string) {
  deletedCardIds.add(cardId)
}

// 테스트끼리 삭제 상태가 섞이지 않게 되돌린다
export function resetMockRecordDeletions() {
  deletedCardIds.clear()
}

// 완료한 드라이브 기록 전체 (최신순)
export function createMockRecords(): RecordSummary[] {
  return createAllMockRecords().filter((record) => !deletedCardIds.has(record.cardId))
}

function createAllMockRecords(): RecordSummary[] {
  return SEEDS.flatMap((seed, seedIndex) => {
    const placeId = `plc_${String(seedIndex + 1).padStart(2, '0')}`
    const coordinate = { latitude: seed.latitude, longitude: seed.longitude }
    return seed.drives.map((drive, driveIndex) => {
      const id = `${String(seedIndex + 1).padStart(2, '0')}${driveIndex === 0 ? '' : `_${driveIndex + 1}`}`
      return {
        cardId: `crd_${id}`,
        driveId: `drv_${id}`,
        title: drive.title,
        driveDate: drive.driveDate,
        destination: { placeId, name: seed.name, address: seed.address, coordinate },
        thumbnailUrl: `/mocks/spots/${seed.photo}.webp`,
        distanceMeters: 28_700 + seedIndex * 18_300 + driveIndex * 4_100,
        activeDurationSeconds: 2_400 + seedIndex * 840 + driveIndex * 600,
        completedAt: `${drive.driveDate}T09:00:00Z`,
      }
    })
  }).sort(byLatest)
}

// 목적지별로 묶은 지도 마커. 최신 기록이 대표가 된다
export function createMockRecordMarkers(records: RecordSummary[] = createMockRecords()): RecordMapMarker[] {
  const groups = new Map<string, RecordSummary[]>()
  for (const record of records) {
    const key = `place:${record.destination?.placeId}`
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  return [...groups].map(([groupKey, cards]) => ({
    groupKey,
    coordinate: cards[0].destination!.coordinate,
    latestCard: cards[0],
    recordCount: cards.length,
  }))
}

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_${++requestCount}`, serverTime: new Date().toISOString() })

// 명세: 제목 · 목적지명 부분 검색, 날짜 범위는 양끝 포함
function matches(record: RecordSummary, { q, date, fromDate, toDate }: FetchRecordsParams) {
  if (q && !`${record.title} ${record.destination?.name ?? ''}`.includes(q)) return false
  if (date && record.driveDate !== date) return false
  if (fromDate && record.driveDate < fromDate) return false
  if (toDate && record.driveDate > toDate) return false
  return true
}

function paginate<T>(items: T[], cursor: string | undefined, limit: number) {
  const start = cursor ? Number(cursor) : 0
  const hasMore = start + limit < items.length
  return { page: items.slice(start, start + limit), nextCursor: hasMore ? String(start + limit) : null, hasMore }
}

export async function mockFetchRecords(params: FetchRecordsParams = {}): Promise<ApiResponse<RecordPage>> {
  const all = createMockRecords()
  const filtered = all.filter((record) => matches(record, params))
  const { page, nextCursor, hasMore } = paginate(filtered, params.cursor, params.limit ?? 20)

  return {
    data: { totalCount: all.length, filteredCount: filtered.length, items: page, nextCursor, hasMore },
    meta: meta(),
  }
}

export async function mockFetchRecordMap(params: FetchRecordMapParams = {}): Promise<ApiResponse<RecordMap>> {
  const { bounds } = params
  const markers = createMockRecordMarkers(createMockRecords().filter((record) => matches(record, params))).filter(
    ({ coordinate: { latitude, longitude } }) =>
      !bounds || (longitude >= bounds.west && longitude <= bounds.east && latitude >= bounds.south && latitude <= bounds.north),
  )
  const { page, nextCursor, hasMore } = paginate(markers, params.cursor, params.limit ?? 20)

  return {
    data: { totalCount: markers.reduce((sum, marker) => sum + marker.recordCount, 0), markers: page, nextCursor, hasMore },
    meta: meta(),
  }
}

export async function mockFetchRecordCalendar(month: string): Promise<ApiResponse<RecordCalendar>> {
  const counts = new Map<string, number>()
  for (const { driveDate } of createMockRecords()) {
    if (driveDate.startsWith(`${month}-`)) counts.set(driveDate, (counts.get(driveDate) ?? 0) + 1)
  }
  const days = [...counts].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))

  return { data: { month, days }, meta: meta() }
}
