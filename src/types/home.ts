import type { PendingCard } from './card'
import type { Couple } from './couple'
import type { Me } from './me'

// GET /home?latitude&longitude 응답 (백엔드 HomeExploreService.HomeView)
// 커플이 CONNECTED가 아니면 couple=null, mascotName='붕붕이', activeDriveId=null, pendingCards=[]
export interface HomeResponse {
  me: Me
  couple: Couple | null
  mascotName: string
  unreadNotificationCount: number
  activeDriveId: string | null
  pendingCards: PendingCard[] // 작성 기간이 남은 UNWRITTEN · DRAFT 카드
  context: HomeContextResponse
}

// 반경 5km 날씨 · 교통 · 테마. 좌표를 안 보내거나 조회에 실패하면 값이 null
// traffic · recommendedTheme 은 아직 백엔드가 채우지 않는다 (항상 null)
export interface HomeContextResponse {
  weather: string | null // 맑음 · 구름 많음 · 흐림 · 비 · 비/눈 · 눈 · 빗방울 · 빗방울/눈날림 · 눈날림
  temperatureC: number | null
  traffic: string | null
  recommendedTheme: string | null
  radiusMeters: number
  weatherAvailable: boolean
  trafficAvailable: boolean
  observedAt: string | null
}

// 홈 상단 드라이브 정보 배너. 값이 없으면 null → 화면에서는 '--'로 표시한다
export interface DriveContext {
  weather: string | null // 예) 맑음
  temperature: number | null // 섭씨 (context.temperatureC)
  traffic: string | null // 예) 원활
  recommendedTheme: string | null // 예) 바다 드라이브
}

// 홈 화면에 필요한 값만 추린 모델 (GET /home 응답에서 매핑)
export interface HomeSummary {
  userId: string // me.id. 드라이브 카드에서 내 소감과 연인 소감을 나누는 데 쓴다
  nickname: string // me.nickname
  mascotName: string // mascotName
  // couple.daysTogether (시작일 당일이 1). 커플 미연결이면 null → D+ 표시를 숨긴다
  daysTogether: number | null
  unreadNotificationCount: number
  // 연결된 커플. 미연결이면 null (couple.id, 상대방 members[].nickname)
  couple: { id: string; partnerNickname: string } | null
  context: DriveContext
}
