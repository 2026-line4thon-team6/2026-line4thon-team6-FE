import { useEffect, useState } from 'react'
import { fetchPendingCards } from '@/api/cards'

interface Deadline {
  driveId: string
  endsAt: number // 기기 시각 기준 마감 (ms)
}

export interface PendingSummary {
  count: number
  driveId: string // 마감이 가장 빠른 카드의 드라이브
  remainingSeconds: number
}

// 홈의 미작성 카드 배너 · 팝업 데이터 (GET /cards/pending)
// 기기 시계가 틀려도 맞도록 서버가 준 remainingSeconds를 받은 시점부터 1초씩 줄인다
function usePendingCards() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let ignore = false

    fetchPendingCards()
      .then(({ data }) => {
        if (ignore) return
        const receivedAt = Date.now()
        setNow(receivedAt)
        setDeadlines(data.map((card) => ({ driveId: card.driveId, endsAt: receivedAt + card.remainingSeconds * 1000 })))
      })
      .catch(() => {
        // 배너는 보조 정보라 실패하면 띄우지 않는다
        if (!ignore) setDeadlines([])
      })

    return () => {
      ignore = true
    }
  }, [])

  const active = deadlines.filter((deadline) => deadline.endsAt > now).sort((a, b) => a.endsAt - b.endsAt)
  const hasActive = active.length > 0

  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasActive])

  const summary: PendingSummary | null = hasActive
    ? {
        count: active.length,
        driveId: active[0].driveId,
        remainingSeconds: Math.ceil((active[0].endsAt - now) / 1000),
      }
    : null

  return { summary }
}

export default usePendingCards
