import cafeIcon from '@/assets/images/category/cafe.svg'
import campingIcon from '@/assets/images/category/camping.svg'
import natureIcon from '@/assets/images/category/nature.svg'
import nightViewIcon from '@/assets/images/category/night-view.svg'
import seaIcon from '@/assets/images/category/sea.svg'
import type { Category, SpotSummary } from '@/types/spot'

// 홈 화면 목업 데이터 (API 연동 전 미리보기·스토리북용)
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: '바다', iconUrl: seaIcon },
  { id: 2, name: '야경', iconUrl: nightViewIcon },
  { id: 3, name: '근교 카페', iconUrl: cafeIcon },
  { id: 4, name: '자연', iconUrl: natureIcon },
  { id: 5, name: '차박', iconUrl: campingIcon },
]

export const MOCK_SPOTS: SpotSummary[] = [
  { id: 1, name: '시흥 오이도', region: '경기 시흥시', travelTime: '약 1시간', tags: ['일몰', '해안도로'], categoryId: 1, liked: true },
  { id: 2, name: '강릉 헌화로', region: '강원 강릉시', travelTime: '약 3시간', tags: ['바다', '해안도로'], categoryId: 1, liked: false },
  { id: 3, name: '남양주 북한강 카페거리', region: '경기 남양주시', travelTime: '약 50분', tags: ['리버뷰', '카페투어'], categoryId: 3, liked: false },
  { id: 4, name: '인천 을왕리 해수욕장', region: '인천 중구', travelTime: '약 1시간 10분', tags: ['도심드라이브', '서울', '야경'], categoryId: 1, liked: false },
]
