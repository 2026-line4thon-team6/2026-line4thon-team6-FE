import { discardCard, fetchDriveCard } from '@/api/cards'
import { ApiError } from '@/api/client'
import type { DeleteOutcome } from '@/hooks/useCardDetail'
import { createIdempotencyKey } from '@/utils/share'

// 미작성 카드 목록에서 아무도 쓰지 않은 카드를 바로 지운다 (POST /cards/{cardId}/discard).
// 목록(GET /home pendingCards)에는 카드 버전 · 커플 id가 없어 카드를 먼저 불러와 그 값으로 보낸다.
// 지웠거나 그사이 연인이 쓰기 시작했으면(started) 목록을 다시 불러온다(onChanged)
function usePendingCardDiscard(onChanged: () => void) {
  return async (driveId: string): Promise<DeleteOutcome> => {
    try {
      const { data: card } = await fetchDriveCard(driveId)
      await discardCard(card, createIdempotencyKey())
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        onChanged()
        return reason.code === 'CARD_DRAFT_STARTED' ? 'started' : 'conflict'
      }
      if (!(reason instanceof ApiError && (reason.status === 404 || reason.status === 410))) return 'failed'
    }
    onChanged()
    return 'deleted'
  }
}

export default usePendingCardDiscard
