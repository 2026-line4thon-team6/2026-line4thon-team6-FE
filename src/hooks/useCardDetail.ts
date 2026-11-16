import { useEffect, useState } from 'react'
import { deleteCard, fetchCard } from '@/api/cards'
import { ApiError } from '@/api/client'
import type { Card } from '@/types/card'
import { photoRefreshDelay } from '@/utils/photoRefresh'

type Status = 'loading' | 'ready' | 'notFound' | 'error'
export type DeleteOutcome = 'deleted' | 'conflict' | 'failed'

interface State {
  status: Status
  card: Card | null
}

const isApiError = (error: unknown, status: number): error is ApiError =>
  error instanceof ApiError && error.status === status

// 기록 상세 (GET /cards/{cardId}) 불러오기와 삭제 (DELETE /cards/{cardId})
function useCardDetail(cardId: string) {
  const [state, setState] = useState<State>({ status: 'loading', card: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchCard(cardId)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', card: data })
      })
      .catch((error: unknown) => {
        // 410: 완료하지 않은 채 작성 기간(24시간)이 지난 카드 — 사라진 카드로 본다
        const gone = isApiError(error, 404) || isApiError(error, 410)
        if (!ignore) setState({ status: gone ? 'notFound' : 'error', card: null })
      })

    return () => {
      ignore = true
    }
  }, [cardId, attempt])

  // 사진 링크가 만료되기 전에 조용히 다시 불러온다 (실패하면 지금 화면을 그대로 둔다)
  const card = state.card
  useEffect(() => {
    if (!card) return
    const delay = photoRefreshDelay(card.photos, Date.now())
    if (delay === null) return
    let ignore = false
    const timer = setTimeout(() => {
      fetchCard(cardId)
        .then(({ data }) => {
          if (!ignore) setState({ status: 'ready', card: data })
        })
        .catch(() => {})
    }, delay)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [card, cardId])

  const retry = () => {
    setState({ status: 'loading', card: null })
    setAttempt((count) => count + 1)
  }

  // 상대가 그사이 카드를 바꿨으면(409) 최신 버전을 다시 불러온다. 이미 지워진 카드(404)는 삭제된 것으로 본다
  const remove = async (): Promise<DeleteOutcome> => {
    if (!state.card) return 'failed'
    try {
      await deleteCard(state.card)
      return 'deleted'
    } catch (error) {
      if (isApiError(error, 404)) return 'deleted'
      if (isApiError(error, 409)) {
        void fetchCard(cardId)
          .then(({ data }) => setState({ status: 'ready', card: data }))
          .catch(() => {})
        return 'conflict'
      }
      return 'failed'
    }
  }

  return { ...state, retry, remove }
}

export default useCardDetail
