import { useEffect, useState } from 'react'
import { deleteCard, fetchCard } from '@/api/cards'
import { ApiError } from '@/api/client'
import type { Card } from '@/types/card'

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
        if (!ignore) setState({ status: isApiError(error, 404) ? 'notFound' : 'error', card: null })
      })

    return () => {
      ignore = true
    }
  }, [cardId, attempt])

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
