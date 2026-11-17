import { useState } from 'react'
import type { PendingCards } from './usePendingCards'

// 미작성 카드 배너를 눌렀을 때: 1개면 바로 그 카드로, 2개 이상이면 목록 시트에서 고르게 한다
function usePendingCardPicker(summary: PendingCards | null, goCard: (driveId: string) => void) {
  const [open, setOpen] = useState(false)
  // 보는 사이 마감이 지나거나 저장돼 1개 이하가 되면 시트를 닫는다
  const sheetOpen = open && (summary?.count ?? 0) > 1

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
