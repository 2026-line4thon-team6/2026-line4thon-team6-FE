// API 명세의 Faq 스키마 (GET /faqs). 로그인 없이 볼 수 있고, 페이지 나눔 없이 전체를 돌려준다
export interface Faq {
  id: string
  question: string
  answer: string // 줄바꿈(\n)으로 문단을 나눈 본문
  order: number // 작은 값부터 위에 보여 준다
}
