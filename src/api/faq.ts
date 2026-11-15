import { mockFetchFaqs } from '@/mocks/faq'
import type { ApiResponse } from '@/types/api'
import type { Faq } from '@/types/faq'
import { apiFetch, USE_MOCK } from './client'

// GET /faqs — 자주 묻는 질문 전체. 로그인 없이 볼 수 있고 페이지 나눔이 없다
export function fetchFaqs(): Promise<ApiResponse<Faq[]>> {
  if (USE_MOCK) return mockFetchFaqs()

  return apiFetch<Faq[]>('/faqs')
}
