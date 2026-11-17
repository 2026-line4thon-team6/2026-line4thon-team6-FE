import { useState } from 'react'
import type { PendingCards } from './usePendingCards'

// 미작성 카드 배너를 눌렀을 때: 1개면 바로 그 카드로, 2개 이상이면 목록 시트에서 고르게 한다
function usePendingCardPicker(summary: PendingCards | null, goCard: (driveId: string) => void) {
  const [open, setOpen] = useState(false)
  // 한 번 연 시트는 목록에서 지워 1개만 남아도 열어 둔다. 마감 · 저장 · 삭제로 0개가 되면 닫는다
  const sheetOpen = open && (summary?.count ?? 0) > 0

  return {
    sheetOpen,
    open: () => {
      if (!summary) return
      if (summary.count > 1) setOpen(true)
      else goCard(summary.driveId)
    },
    select: (driveId: string) => {
      setOpen(false)
      goCard(driveId)
    },
    close: () => setOpen(false),
  }
}

export default usePendingCardPicker
