import type { FetchRecordMapParams } from '@/api/records'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { RecordMap, RecordMapMarker } from '@/types/record'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 기록 지도 목 응답.
// Figma 기록 지도처럼 전국에 흩어진 목적지 마커를 만든다. 사진은 public/mocks/spots 를 쓴다
interface Seed {
  name: string
  address: string
  latitude: number
  longitude: number
  photo: string
  title: string
  driveDate: string
  recordCount: number
}

const SEEDS: Seed[] = [
  { name: '가평 자라섬', address: '경기 가평군 가평읍', latitude: 37.8215, longitude: 127.5262, photo: 'jaraseom', title: '자라섬 캠핑 드라이브', driveDate: '2026-11-08', recordCount: 1 },
  { name: '시흥 오이도', address: '경기 시흥시 정왕동', latitude: 37.3456, longitude: 126.6878, photo: 'oido', title: '오이도 노을 보러', driveDate: '2026-11-02', recordCount: 2 },
  { name: '태안 몽산포', address: '충남 태안군 남면', latitude: 36.6735, longitude: 126.2786, photo: 'mongsanpo', title: '몽산포 해변 산책', driveDate: '2026-10-24', recordCount: 1 },
  { name: '양평 두물머리', address: '경기 양평군 양서면', latitude: 37.5337, longitude: 127.3149, photo: 'dumulmeori', title: '두물머리 아침 드라이브', driveDate: '2026-10-18', recordCount: 1 },
  { name: '강릉 헌화로', address: '강원 강릉시 강동면', latitude: 37.7155, longitude: 129.0124, photo: 'heonhwaro', title: '헌화로 바다 드라이브', driveDate: '2026-10-11', recordCount: 2 },
  { name: '포천 산정호수', address: '경기 포천시 영북면', latitude: 38.0697, longitude: 127.3136, photo: 'sanjeong-lake', title: '산정호수 단풍길', driveDate: '2026-10-03', recordCount: 1 },
  { name: '군산 새만금', address: '전북 군산시 옥도면', latitude: 35.8228, longitude: 126.5288, photo: 'songdo', title: '새만금 방조제 달리기', driveDate: '2026-09-20', recordCount: 1 },
  { name: '여수 돌산', address: '전남 여수시 돌산읍', latitude: 34.7271, longitude: 127.7449, photo: 'banpo', title: '여수 밤바다', driveDate: '2026-09-06', recordCount: 1 },
  { name: '남해 독일마을', address: '경남 남해군 삼동면', latitude: 34.7988, longitude: 128.0414, photo: 'eurwangni', title: '남해 노을 드라이브', driveDate: '2026-08-30', recordCount: 1 },
  { name: '부산 광안리', address: '부산 수영구 광안동', latitude: 35.1532, longitude: 129.1186, photo: 'namsan', title: '광안대교 야경', driveDate: '2026-08-15', recordCount: 1 },
]

export function createMockRecordMarkers(): RecordMapMarker[] {
  return SEEDS.map((seed, index) => {
    const id = String(index + 1).padStart(2, '0')
    const coordinate = { latitude: seed.latitude, longitude: seed.longitude }
    return {
      groupKey: `place:plc_${id}`,
      coordinate,
      recordCount: seed.recordCount,
      latestCard: {
        cardId: `crd_${id}`,
        driveId: `drv_${id}`,
        title: seed.title,
        driveDate: seed.driveDate,
        destination: { placeId: `plc_${id}`, name: seed.name, address: seed.address, coordinate },
        thumbnailUrl: `/mocks/spots/${seed.photo}.webp`,
        distanceMeters: 50_000 + index * 12_000,
        activeDurationSeconds: 3_600 + index * 600,
        completedAt: `${seed.driveDate}T09:00:00Z`,
      },
    }
  })
}

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_${++requestCount}`, serverTime: new Date().toISOString() })

function matches(marker: RecordMapMarker, { bounds, q, date }: FetchRecordMapParams) {
  const { latitude, longitude } = marker.coordinate
  if (bounds && (longitude < bounds.west || longitude > bounds.east || latitude < bounds.south || latitude > bounds.north)) {
    return false
  }
  if (q && !`${marker.latestCard.title} ${marker.latestCard.destination?.name ?? ''}`.includes(q)) return false
  if (date && marker.latestCard.driveDate !== date) return false
  return true
}

export async function mockFetchRecordMap(params: FetchRecordMapParams = {}): Promise<ApiResponse<RecordMap>> {
  const { cursor, limit = 20 } = params
  const all = createMockRecordMarkers().filter((marker) => matches(marker, params))
  const start = cursor ? Number(cursor) : 0
  const hasMore = start + limit < all.length

  return {
    data: {
      totalCount: all.reduce((sum, marker) => sum + marker.recordCount, 0),
      markers: all.slice(start, start + limit),
      nextCursor: hasMore ? String(start + limit) : null,
      hasMore,
    },
    meta: meta(),
  }
}
