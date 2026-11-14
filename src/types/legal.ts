// API 명세의 LegalDocument 스키마 (GET /legal-documents/{type})
export type LegalDocumentType = 'TERMS' | 'PRIVACY' | 'OPEN_SOURCE'

export interface LegalDocument {
  type: LegalDocumentType
  version: string
  title: string
  required: boolean
  url: string
  content: string // 줄바꿈(\n)으로 문단을 나눈 본문
  effectiveDate: string // YYYY-MM-DD
}
