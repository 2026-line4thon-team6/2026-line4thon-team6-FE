import { useEffect, useMemo, useState } from 'react'
import type { PendingCard } from '@/types/card'

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000

interface Deadline {
  cardId: string
  driveId: string
  title: string
  writing: boolean
  endedAt: string
  endsAt: number // 기기 시각 기준 마감 (ms)
}

// 미작성 카드 목록 시트의 한 줄
export interface PendingCardItem {
  cardId: string
  driveId: string
  title: string
  remainingSeconds: number
  // 둘 중 누군가 쓰기 시작한 카드 (임시저장 있음)
  writing: boolean
  // 드라이브를 마친 시각. 작성 기한(editableUntil)은 마친 뒤 24시간이라 거꾸로 계산한다
  endedAt: string
}

// 배너 · 팝업에 쓰는 요약
export interface PendingSummary {
  count: number
  driveId: string // 마감이 가장 빠른 카드의 드라이브
  remainingSeconds: number
}

// 요약 + 목록 시트에 쓰는 전체 목록 (마감순)
export interface PendingCards extends PendingSummary {
  cards: PendingCardItem[]
}

// 홈의 미작성 카드 배너 · 팝업 데이터 (GET /home 의 pendingCards). 아직 불러오지 않았으면 null을 넘긴다
// 기기 시계가 틀려도 맞도록 서버가 준 remainingSeconds를 받은 시각(receivedAt, ms)부터 1초씩 줄인다
function usePendingCards(cards: PendingCard[] | null, receivedAt: number): PendingCards | null {
  const [tick, setTick] = useState(() => Date.now())
  // 새 목록을 받은 직후에는 아직 tick이 그 전 시각일 수 있어 받은 시각보다 앞서지 않게 한다
  const now = Math.max(tick, receivedAt)

  const deadlines: Deadline[] = useMemo(
    () =>
      (cards ?? []).map((card) => ({
        cardId: card.cardId,
        driveId: card.driveId,
        title: card.title,
        writing: card.status === 'DRAFT' || card.hasDraftContent,
        endedAt: new Date(Date.parse(card.editableUntil) - EDIT_WINDOW_MS).toISOString(),
        endsAt: receivedAt + card.remainingSeconds * 1000,
      })),
    [cards, receivedAt],
  )
  const active = deadlines.filter((deadline) => deadline.endsAt > now).sort((a, b) => a.endsAt - b.endsAt)
  const hasActive = active.length > 0

  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasActive])

  if (!hasActive) return null
  const items = active.map(({ endsAt, ...rest }) => ({ ...rest, remainingSeconds: Math.ceil((endsAt - now) / 1000) }))
  return { count: items.length, driveId: items[0].driveId, remainingSeconds: items[0].remainingSeconds, cards: items }
}

export default usePendingCards
