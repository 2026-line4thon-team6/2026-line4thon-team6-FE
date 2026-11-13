import type { ApiMeta, ApiResponse, CursorPage } from '@/types/api'
import type { PlaceCategory, PlaceDetail, PlaceShare, PlaceSummary, SendToPartnerResult } from '@/types/place'
import { MOCK_SPOTS } from './home'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 장소 목 응답.
// 홈의 목 장소(MOCK_SPOTS)와 같은 15곳을 API 형식으로 바꿔 쓴다. 장소 id는 홈 카드의 id를 문자열로 쓴다
const CATEGORY_BY_ID: Record<number, PlaceCategory> = {
  1: 'SEA',
  2: 'NIGHT_VIEW',
  3: 'NEARBY_CAFE',
  4: 'NATURE',
  5: 'CAR_CAMPING',
}

// '약 1시간 10분' → 4200
function toSeconds(travelTime: string) {
  const hours = Number(/(\d+)시간/.exec(travelTime)?.[1] ?? 0)
  const minutes = Number(/(\d+)분/.exec(travelTime)?.[1] ?? 0)
  return (hours * 60 + minutes) * 60
}

// Figma 상세 화면(시흥 오이도)의 내용. 사진은 3장뿐이라 8장이 되도록 반복한다
const OIDO: Omit<PlaceDetail, 'place'> = {
  photos: Array.from({ length: 8 }, (_, index) => `/mocks/places/oido-${(index % 3) + 1}.webp`),
  introduction:
    '연인과 함께 서해 바다를 따라 달리며 낭만적인 시간을 보내보세요. 붉은 등대와 아름다운 노을이 어우러진 오이도에서 둘만의 특별한 추억을 만들 수 있어요.',
  parkingInfo: '공영주차장 이용 가능',
  recommendedVisitTime: '오후 5-8시 (일몰 시간대)',
  mainRoads: ['서해안 고속도로'],
  previewRouteId: 'route_01',
}

function createStore(): Map<string, PlaceDetail> {
  return new Map(
    MOCK_SPOTS.map((spot) => {
      const id = String(spot.id)
      const place: PlaceSummary = {
        id,
        name: spot.name,
        region: spot.region,
        address: spot.region,
        coordinate: { latitude: 37.3456, longitude: 126.6878 },
        thumbnailUrl: spot.imageUrl ?? null,
        category: CATEGORY_BY_ID[spot.categoryId],
        hashtags: id === '1' ? [...spot.tags, '드라이브코스'] : spot.tags,
        estimatedDurationSeconds: toSeconds(spot.travelTime),
        distanceMeters: null,
        isFavorite: spot.liked,
      }
      const detail: PlaceDetail =
        id === '1'
          ? { place, ...OIDO }
          : {
              place,
              photos: spot.imageUrl ? [spot.imageUrl] : [],
              introduction: `${spot.name}에서 둘만의 드라이브를 즐겨 보세요.`,
              parkingInfo: null,
              recommendedVisitTime: null,
              mainRoads: [],
              previewRouteId: null,
            }
      return [id, detail]
    }),
  )
}

let store: Map<string, PlaceDetail> | null = null
let requestCount = 0

const meta = (): ApiMeta => ({ requestId: `req_mock_place_${++requestCount}`, serverTime: new Date().toISOString() })

// 테스트 · 스토리에서 처음 상태(홈 목 데이터의 찜 여부)로 되돌린다
export function resetMockPlaces() {
  store = null
}

function getDetail(placeId: string) {
  const detail = (store ??= createStore()).get(placeId)
  if (!detail) throw new Error(`장소를 찾을 수 없어요: ${placeId}`)
  return detail
}

export async function mockFetchPlaceDetail(placeId: string): Promise<ApiResponse<PlaceDetail>> {
  return { data: getDetail(placeId), meta: meta() }
}

export async function mockFetchPlaceShare(placeId: string): Promise<ApiResponse<PlaceShare>> {
  getDetail(placeId)
  return {
    data: { url: `https://bunbungus.app/places/${placeId}`, access: 'PUBLIC_PLACE', expiresAt: null },
    meta: meta(),
  }
}

export async function mockSetPlaceFavorite(placeId: string, favorite: boolean): Promise<void> {
  const detail = getDetail(placeId)
  store!.set(placeId, { ...detail, place: { ...detail.place, isFavorite: favorite } })
}

// 찜한 장소만, 홈 목 데이터 순서대로. category를 생략하면 전체
export async function mockFetchFavorites(category?: PlaceCategory): Promise<ApiResponse<CursorPage<PlaceSummary>>> {
  const items = [...(store ??= createStore()).values()]
    .map(({ place }) => place)
    .filter((place) => place.isFavorite && (!category || place.category === category))
  return { data: { items, nextCursor: null, hasMore: false }, meta: meta() }
}

export async function mockSendPlaceToPartner(placeId: string): Promise<ApiResponse<SendToPartnerResult>> {
  getDetail(placeId)
  const response = meta()
  return {
    data: { notificationId: `ntf_mock_${requestCount}`, recipientUserId: 'usr_partner', sentAt: response.serverTime },
    meta: response,
  }
}
