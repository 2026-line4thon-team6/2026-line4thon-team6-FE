// 홈 큐레이션 카테고리 (백엔드 응답 연동 예정)
export interface Category {
  id: number
  name: string // 예) 바다, 야경, 근교 카페
  iconUrl: string
}

// 홈 큐레이션 카드에 쓰이는 스팟 요약 정보 (백엔드 응답 연동 예정)
export interface SpotSummary {
  id: number
  name: string // 예) 시흥 오이도
  region: string // 예) 경기 시흥시
  travelTime: string // 예) 약 1시간
  imageUrl?: string
  tags: string[] // '#' 제외. 예) ['일몰', '해안도로']
  categoryId: number
  liked: boolean
}
