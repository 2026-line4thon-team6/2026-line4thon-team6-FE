import { useRef } from 'react'
import { ApiError } from '@/api/client'
import type { SendToPartnerOptions } from '@/api/places'
import { createIdempotencyKey } from '@/utils/share'

// 그 사이 연결이 해제됐거나(COUPLE_REQUIRED) 다른 커플로 바뀌었으면(COUPLE_CONTEXT_CHANGED) 서버가 403으로 거절한다
const COUPLE_CHANGED_CODES = ['COUPLE_CONTEXT_CHANGED', 'COUPLE_REQUIRED']

interface Options {
  coupleId: string | null
  send: (options: SendToPartnerOptions) => Promise<unknown>
  // 커플이 바뀌었을 때 커플 정보를 다시 불러온다
  onCoupleChanged: () => void
}

// 장소를 연인에게 보낸다 (POST /places/{placeId}/send-to-partner).
// 같은 전송 시도의 재시도에는 같은 멱등 키를 쓰고, 성공하거나 커플이 바뀌면 새 키로 바꾼다
function useSendToPartner({ coupleId, send, onCoupleChanged }: Options) {
  const idempotencyKey = useRef<string | null>(null)

  return async () => {
    if (!coupleId) return
    idempotencyKey.current ??= createIdempotencyKey()
    try {
      await send({ idempotencyKey: idempotencyKey.current, coupleId })
      idempotencyKey.current = null
    } catch (error) {
      if (error instanceof ApiError && error.status === 403 && COUPLE_CHANGED_CODES.includes(error.code)) {
        idempotencyKey.current = null
        onCoupleChanged()
      }
      throw error
    }
  }
}

export default useSendToPartner
