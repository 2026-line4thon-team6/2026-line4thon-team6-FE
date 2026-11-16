import type { ApiMeta, ApiResponse, CursorPage, CursorParams } from '@/types/api'
import type {
  PlaceCategory,
  PlaceDetail,
  PlaceRecommendations,
  PlaceShare,
  PlaceSummary,
  PublicPlace,
  SendToPartnerResult,
} from '@/types/place'
import { mockApiError, paginate } from './utils'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 장소 목 응답.
// 백엔드 추천 카탈로그(HardcodedPlaceCatalog)와 같은 15곳 · 같은 id. 카테고리마다 3곳 (Figma Home_Components 카드)
const place = (
  id: string,
  name: string,
  region: string,
  minutes: number,
  hashtags: string[],
  category: PlaceCategory,
  isFavorite: boolean,
  image: string,
): PlaceSummary => ({
  id,
  name,
  region,
  address: region,
  coordinate: { latitude: 37.3456, longitude: 126.6878 },
  thumbnailUrl: `/mocks/spots/${image}.webp`,
  category,
  hashtags,
  estimatedDurationSeconds: minutes * 60,
  distanceMeters: null,
  isFavorite,
})

export const MOCK_PLACES: PlaceSummary[] = [
  place('plc_oido', '시흥 오이도', '경기 시흥시', 60, ['일몰', '해안도로'], 'SEA', true, 'oido'),
  place('plc_heonhwaro', '강릉 헌화로', '강원 강릉시', 180, ['바다', '해안도로'], 'SEA', false, 'heonhwaro'),
  place('plc_eurwangni', '인천 을왕리 해수욕장', '인천 영종구', 70, ['바다', '노을'], 'SEA', false, 'eurwangni'),
  place('plc_namsan', '서울 남산 순환도로', '서울 중구', 20, ['도심드라이브', '서울'], 'NIGHT_VIEW', true, 'namsan'),
  place('plc_banpo', '서울 반포한강공원', '서울 서초구', 30, ['한강', '데이트'], 'NIGHT_VIEW', false, 'banpo'),
  place('plc_songdo', '인천 송도 센트럴파크', '인천 연수구', 60, ['야경', '도시전망'], 'NIGHT_VIEW', false, 'songdo'),
  place('plc_bukhangang_cafe', '남양주 북한강 카페거리', '경기 남양주시', 50, ['리버뷰', '카페투어'], 'NEARBY_CAFE', true, 'bukhangang-cafe'),
  place('plc_heyri', '파주 헤이리 예술마을', '경기 파주시', 60, ['감성카페', '데이트'], 'NEARBY_CAFE', false, 'heyri'),
  place('plc_seojong_cafe', '양평 서종 카페거리', '경기 양평군', 60, ['자연뷰', '힐링'], 'NEARBY_CAFE', false, 'seojong-cafe'),
  place('plc_dumulmeori', '양평 두물머리', '경기 양평군', 60, ['자연', '강변'], 'NATURE', true, 'dumulmeori'),
  place('plc_cheongpyeong', '가평 청평호반', '경기 가평군', 60, ['호수', '자연 풍경'], 'NATURE', false, 'cheongpyeong'),
  place('plc_sanjeong_lake', '포천 산정호수', '경기 포천시', 120, ['호수', '숲길'], 'NATURE', false, 'sanjeong-lake'),
  place('plc_mongsanpo', '태안 몽산포 캠핑장', '충남 태안군', 180, ['차박', '바다'], 'CAR_CAMPING', true, 'mongsanpo'),
  place('plc_jaraseom', '가평 자라섬 캠핑장', '경기 가평군', 60, ['차박', '캠핑'], 'CAR_CAMPING', false, 'jaraseom'),
  place('plc_baengnoju', '포천 백로주 캠핑장', '경기 포천시', 120, ['차박', '힐링'], 'CAR_CAMPING', false, 'baengnoju'),
]

// 시흥 오이도 — Figma 상세 화면의 장소
export const MOCK_PLACE_ID = 'plc_oido'

// Figma 상세 화면(시흥 오이도)의 내용. 사진은 Figma의 대표 사진 1장 (70:1744)
const OIDO: Omit<PlaceDetail, 'place'> = {
  photos: ['/mocks/places/oido-1.webp'],
  introduction:
    '연인과 함께 서해 바다를 따라 달리며 낭만적인 시간을 보내보세요. 붉은 등대와 아름다운 노을이 어우러진 오이도에서 둘만의 특별한 추억을 만들 수 있어요.',
  parkingInfo: '공영주차장 이용 가능',
  recommendedVisitTime: '오후 5-8시 (일몰 시간대)',
  mainRoads: ['서해안 고속도로'],
  previewRouteId: 'route_01',
}

function createStore(): Map<string, PlaceDetail> {
  return new Map(
    MOCK_PLACES.map((summary) => {
      const detail: PlaceDetail =
        summary.id === MOCK_PLACE_ID
          ? { place: { ...summary }, ...OIDO }
          : {
              place: { ...summary },
              photos: summary.thumbnailUrl ? [summary.thumbnailUrl] : [],
              introduction: `${summary.name}에서 둘만의 드라이브를 즐겨 보세요.`,
              parkingInfo: null,
              recommendedVisitTime: null,
              mainRoads: [],
              previewRouteId: null,
            }
      return [summary.id, detail]
    }),
  )
}

let store: Map<string, PlaceDetail> | null = null
let requestCount = 0

const meta = (): ApiMeta => ({ requestId: `req_mock_place_${++requestCount}`, serverTime: new Date().toISOString() })

// 테스트 · 스토리에서 처음 상태(목 장소의 찜 여부)로 되돌린다
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

// 공개 장소 조회는 회원 상세와 같은 장소 목록에서 공개해도 되는 값만 골라 준다.
// 없는 장소는 실서버처럼 404로 응답해 화면의 '찾을 수 없음' 상태를 확인할 수 있게 한다
export async function mockFetchPublicPlace(placeId: string): Promise<ApiResponse<PublicPlace>> {
  const detail = (store ??= createStore()).get(placeId)
  if (!detail) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '장소를 찾을 수 없습니다.')

  const { place, introduction } = detail
  return {
    data: {
      id: place.id,
      name: place.name,
      address: place.address,
      coordinate: place.coordinate,
      thumbnailUrl: place.thumbnailUrl,
      introduction,
    },
    meta: meta(),
  }
}

export async function mockSetPlaceFavorite(placeId: string, favorite: boolean): Promise<void> {
  const detail = getDetail(placeId)
  store!.set(placeId, { ...detail, place: { ...detail.place, isFavorite: favorite } })
}

// 찜한 장소만, 목 장소 순서대로. category를 생략하면 전체
export async function mockFetchFavorites(
  category?: PlaceCategory,
  { cursor, limit }: CursorParams = {},
): Promise<ApiResponse<CursorPage<PlaceSummary>>> {
  const items = [...(store ??= createStore()).values()]
    .map(({ place }) => place)
    .filter((place) => place.isFavorite && (!category || place.category === category))
  return { data: paginate(items, cursor, limit), meta: meta() }
}

export async function mockSendPlaceToPartner(placeId: string): Promise<ApiResponse<SendToPartnerResult>> {
  getDetail(placeId)
  const response = meta()
  return {
    data: { notificationId: `ntf_mock_${requestCount}`, recipientUserId: 'usr_partner', sentAt: response.serverTime },
    meta: response,
  }
}

// 카테고리별 추천. 백엔드처럼 카테고리마다 3곳이라 refreshToken으로 다시 받아도 같은 목록이다
export async function mockFetchRecommendations(category: PlaceCategory): Promise<ApiResponse<PlaceRecommendations>> {
  const items = [...(store ??= createStore()).values()]
    .map(({ place: summary }) => summary)
    .filter((summary) => summary.category === category)
  const response = meta()
  return {
    data: { category, items, refreshToken: `rec_mock_${category}`, generatedAt: response.serverTime },
    meta: response,
  }
}
