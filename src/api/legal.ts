import { mockFetchLegalDocument } from '@/mocks/legal'
import type { ApiResponse } from '@/types/api'
import type { LegalDocument, LegalDocumentType } from '@/types/legal'
import { apiFetch, USE_MOCK } from './client'

// GET /legal-documents/{type} — 버전을 생략하면 현재 시행 중인 문서
export function fetchLegalDocument(type: LegalDocumentType): Promise<ApiResponse<LegalDocument>> {
  if (USE_MOCK) return mockFetchLegalDocument(type)

  return apiFetch<LegalDocument>(`/legal-documents/${type}`)
}
