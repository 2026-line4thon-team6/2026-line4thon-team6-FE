// API 명세 공통 응답 형식. 성공 { data, meta } / 오류 { error, meta }
export interface ApiMeta {
  requestId: string
  serverTime: string // UTC RFC3339. 화면의 '며칠 전' 계산은 기기 시계 대신 이 값을 기준으로 한다
}

export interface ApiResponse<T> {
  data: T
  meta: ApiMeta
}

export interface ApiErrorDetail {
  code: string // 예) VALIDATION_FAILED
  message: string
  details: { field: string; reason: string }[]
  retryable: boolean
}

export interface ApiErrorResponse {
  error: ApiErrorDetail
  meta: ApiMeta
}

// 커서 기반 목록. hasMore=false이면 nextCursor=null
export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// 커서 목록 요청 공통 파라미터. 커서는 함께 보낸 필터(검색어 · 카테고리)에 묶여 있어 필터가 바뀌면 버린다
export interface CursorParams {
  cursor?: string // 이전 응답의 nextCursor. 첫 요청은 생략
  limit?: number // 기본 20, 1~100
}
