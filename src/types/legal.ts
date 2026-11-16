// API 명세의 LegalDocument 스키마 (GET /legal-documents/{type})
export type LegalDocumentType = 'TERMS' | 'PRIVACY' | 'OPEN_SOURCE'

export interface LegalDocument {
  type: LegalDocumentType
  version: string
  title: string
  required: boolean
  url: string
  content: string // Markdown 본문 (## 제목 · - 목록 · **굵게**)
  effectiveDate: string // YYYY-MM-DD
}
