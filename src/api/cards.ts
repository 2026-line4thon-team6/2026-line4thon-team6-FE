import { mockDeleteCard, mockFetchCard } from '@/mocks/cards'
import type { ApiResponse } from '@/types/api'
import type { Card } from '@/types/card'
import { apiFetch, USE_MOCK } from './client'

const path = (cardId: string) => `/cards/${encodeURIComponent(cardId)}`

// GET /cards/{cardId} — 카드 상세와 두 사람의 소감
export function fetchCard(cardId: string): Promise<ApiResponse<Card>> {
  if (USE_MOCK) return mockFetchCard(cardId)

  return apiFetch<Card>(path(cardId))
}

// DELETE /cards/{cardId} — 공동 기록 삭제 (복구 불가). 양쪽 기록 · 지도 · 공유 링크에서 바로 빠진다.
// 오래된 화면의 요청을 막기 위해 커플 id와 카드 버전을 함께 보낸다. 버전이 다르면 409
export async function deleteCard(card: Pick<Card, 'id' | 'coupleId' | 'version'>): Promise<void> {
  if (USE_MOCK) return mockDeleteCard(card.id)

  await apiFetch(path(card.id), {
    method: 'DELETE',
    headers: { 'X-Couple-Id': card.coupleId, 'X-Expected-Version': String(card.version) },
  })
}
