import { startTransition, useState } from 'react'
import { prefetchDriveCard } from '@/api/cards'
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
      if (summary.count > 1) {
        // 목록의 카드를 미리 받아 두어, 고른 카드의 작성 화면이 불러오는 중 화면 없이 바로 올라오게 한다
        summary.cards.forEach((card) => void prefetchDriveCard(card.driveId))
        setOpen(true)
      }
      else goCard(summary.driveId)
    },
    // 시트 닫기도 화면 이동과 같은 전환(transition)에 넣는다. 먼저 따로 닫으면 누른 카드 이름이
    // 화면 이동 전에 사라져, 작성 화면 제목 자리로 이어지는 공유 요소 전환이 끊긴다
    select: (driveId: string) => {
      startTransition(() => setOpen(false))
      goCard(driveId)
    },
    close: () => setOpen(false),
  }
}

export default usePendingCardPicker
