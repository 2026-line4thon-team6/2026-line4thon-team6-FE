import { useEffect, useMemo, useState } from 'react'
import type { PendingCard } from '@/types/card'

interface Deadline {
  driveId: string
  endsAt: number // 기기 시각 기준 마감 (ms)
}

export interface PendingSummary {
  count: number
  driveId: string // 마감이 가장 빠른 카드의 드라이브
  remainingSeconds: number
}

// 홈의 미작성 카드 배너 · 팝업 데이터 (GET /home 의 pendingCards). 아직 불러오지 않았으면 null을 넘긴다
// 기기 시계가 틀려도 맞도록 서버가 준 remainingSeconds를 받은 시각(receivedAt, ms)부터 1초씩 줄인다
function usePendingCards(cards: PendingCard[] | null, receivedAt: number): PendingSummary | null {
  const [tick, setTick] = useState(() => Date.now())
  // 새 목록을 받은 직후에는 아직 tick이 그 전 시각일 수 있어 받은 시각보다 앞서지 않게 한다
  const now = Math.max(tick, receivedAt)

  const deadlines: Deadline[] = useMemo(
    () => (cards ?? []).map((card) => ({ driveId: card.driveId, endsAt: receivedAt + card.remainingSeconds * 1000 })),
    [cards, receivedAt],
  )
  const active = deadlines.filter((deadline) => deadline.endsAt > now).sort((a, b) => a.endsAt - b.endsAt)
  const hasActive = active.length > 0

  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasActive])

  return hasActive
    ? { count: active.length, driveId: active[0].driveId, remainingSeconds: Math.ceil((active[0].endsAt - now) / 1000) }
    : null
}

export default usePendingCards
