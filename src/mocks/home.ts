import cafeIcon from '@/assets/images/category/cafe.svg'
import campingIcon from '@/assets/images/category/camping.svg'
import natureIcon from '@/assets/images/category/nature.svg'
import nightViewIcon from '@/assets/images/category/night-view.svg'
import seaIcon from '@/assets/images/category/sea.svg'
import type { HomeSummary } from '@/types/home'
import type { Category, SpotSummary } from '@/types/spot'

// 홈 화면 목업 데이터 (API 연동 전 미리보기·스토리북용)
export const MOCK_HOME: HomeSummary = {
  nickname: '민준',
  mascotName: '붕붕이',
  daysTogether: 23,
  unreadNotificationCount: 1,
  couple: { id: 'cpl_01', partnerNickname: '민지' },
  context: { weather: '맑음', temperature: 22, traffic: '원활', recommendedTheme: '바다 드라이브' },
}

// 장소 사진은 실제로는 API의 이미지 URL로 내려온다. 목 사진은 public/mocks/spots 에 둔다
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: '바다', iconUrl: seaIcon },
  { id: 2, name: '야경', iconUrl: nightViewIcon },
  { id: 3, name: '근교 카페', iconUrl: cafeIcon },
  { id: 4, name: '자연', iconUrl: natureIcon },
  { id: 5, name: '차박', iconUrl: campingIcon },
]

// Figma Home_Components의 카테고리별 장소 카드 (카테고리당 3곳)
export const MOCK_SPOTS: SpotSummary[] = [
  // 바다
  { id: 1, name: '시흥 오이도', region: '경기 시흥시', travelTime: '약 1시간', tags: ['일몰', '해안도로'], categoryId: 1, liked: true, imageUrl: '/mocks/spots/oido.webp' },
  { id: 2, name: '강릉 헌화로', region: '강원 강릉시', travelTime: '약 3시간', tags: ['바다', '해안도로'], categoryId: 1, liked: false, imageUrl: '/mocks/spots/heonhwaro.webp' },
  { id: 3, name: '인천 을왕리 해수욕장', region: '인천 중구', travelTime: '약 1시간 10분', tags: ['바다', '노을'], categoryId: 1, liked: false, imageUrl: '/mocks/spots/eurwangni.webp' },
  // 야경
  { id: 4, name: '서울 남산 순환도로', region: '서울 중구', travelTime: '약 20분', tags: ['도심드라이브', '서울'], categoryId: 2, liked: true, imageUrl: '/mocks/spots/namsan.webp' },
  { id: 5, name: '서울 반포한강공원', region: '서울 서초구', travelTime: '약 30분', tags: ['한강', '데이트'], categoryId: 2, liked: false, imageUrl: '/mocks/spots/banpo.webp' },
  { id: 6, name: '인천 송도 센트럴파크', region: '인천 연수구', travelTime: '약 1시간', tags: ['야경', '도시전망'], categoryId: 2, liked: false, imageUrl: '/mocks/spots/songdo.webp' },
  // 근교 카페
  { id: 7, name: '남양주 북한강 카페거리', region: '경기 남양주시', travelTime: '약 50분', tags: ['리버뷰', '카페투어'], categoryId: 3, liked: true, imageUrl: '/mocks/spots/bukhangang-cafe.webp' },
  { id: 8, name: '파주 헤이리 예술마을', region: '경기 파주시', travelTime: '약 1시간', tags: ['감성카페', '데이트'], categoryId: 3, liked: false, imageUrl: '/mocks/spots/heyri.webp' },
  { id: 9, name: '양평 서종 카페거리', region: '경기 양평군', travelTime: '약 1시간', tags: ['자연뷰', '힐링'], categoryId: 3, liked: false, imageUrl: '/mocks/spots/seojong-cafe.webp' },
  // 자연
  { id: 10, name: '양평 두물머리', region: '경기 양평군', travelTime: '약 1시간', tags: ['자연', '강변'], categoryId: 4, liked: true, imageUrl: '/mocks/spots/dumulmeori.webp' },
  { id: 11, name: '가평 청평호반', region: '경기 가평군', travelTime: '약 1시간', tags: ['호수', '자연 풍경'], categoryId: 4, liked: false, imageUrl: '/mocks/spots/cheongpyeong.webp' },
  { id: 12, name: '포천 산정호수', region: '경기 포천시', travelTime: '약 2시간', tags: ['호수', '숲길'], categoryId: 4, liked: false, imageUrl: '/mocks/spots/sanjeong-lake.webp' },
  // 차박
  { id: 13, name: '태안 몽산포 캠핑장', region: '충남 태안군', travelTime: '약 3시간', tags: ['차박', '바다'], categoryId: 5, liked: true, imageUrl: '/mocks/spots/mongsanpo.webp' },
  { id: 14, name: '가평 자라섬 캠핑장', region: '경기 가평군', travelTime: '약 1시간', tags: ['차박', '캠핑'], categoryId: 5, liked: false, imageUrl: '/mocks/spots/jaraseom.webp' },
  { id: 15, name: '포천 백로주 캠핑장', region: '경기 포천시', travelTime: '약 2시간', tags: ['차박', '힐링'], categoryId: 5, liked: false, imageUrl: '/mocks/spots/baengnoju.webp' },
]
