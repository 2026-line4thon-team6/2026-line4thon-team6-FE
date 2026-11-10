// 홈 상단 드라이브 정보 배너 (GET /home 의 context)
// 값을 불러오지 못하면 null → 화면에서는 '--'로 표시한다
export interface DriveContext {
  weather: string | null // 예) 맑음
  temperature: number | null // 섭씨. API 명세(HomeContext)에 아직 없는 필드 — 백엔드 확인 필요
  traffic: string | null // 예) 원활
  recommendedTheme: string | null // 예) 바다 드라이브
}

// 홈 화면에 필요한 값만 추린 모델 (GET /home 응답에서 매핑)
export interface HomeSummary {
  nickname: string // me.nickname
  mascotName: string // mascotName
  // couple.daysTogether (시작일 당일이 1). 미연결 사용자의 값은 API 미정 — 백엔드 확인 필요
  daysTogether: number
  unreadNotificationCount: number
  context: DriveContext
}
