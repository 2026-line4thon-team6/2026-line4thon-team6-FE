import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { createCoupleInvite, fetchMyInvite, joinCouple } from '@/api/couples'
import { createIdempotencyKey } from '@/utils/share'

interface State {
  // linked: 이미 연인과 연결돼 있어 새 코드를 쓸 수 없다
  status: 'loading' | 'ready' | 'error' | 'linked'
  code: string | null
}

// POST /couples 오류 코드별 안내 (API 명세 422 · 409)
const JOIN_ERRORS: Record<string, string> = {
  VALIDATION_FAILED: '연인의 코드를 입력해 주세요.',
  INVALID_INVITE: '코드를 다시 확인해 주세요.',
  SELF_INVITE: '내 코드는 입력할 수 없어요. 연인의 코드를 입력해 주세요.',
  INVITE_CONSUMED: '이미 사용된 코드예요. 연인에게 새 코드를 받아 주세요.',
  ALREADY_COUPLED: '이미 연인과 연결되어 있어요.',
  COUPLE_RESTORE_REQUIRED: '예전에 연결했던 연인이에요. 연결 복구가 필요해요.',
}
const JOIN_FALLBACK = '연결하지 못했어요. 잠시 후 다시 시도해 주세요.'

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404
const isAlreadyCoupled = (error: unknown) => error instanceof ApiError && error.code === 'ALREADY_COUPLED'

// 내 코드를 불러온다. 없거나(404) 쓸 수 없는 코드(연결에 쓴 코드 · 폐기 · 만료)면 새로 발급한다.
// 발급은 create-or-get이라 반복해도 안전하고, 이미 연결돼 있으면 409 ALREADY_COUPLED가 난다
async function loadInvite(idempotencyKey: string) {
  try {
    const { data } = await fetchMyInvite()
    if (data.status === 'ACTIVE') return data
  } catch (error) {
    if (!isNotFound(error)) throw error
  }
  return (await createCoupleInvite(idempotencyKey)).data
}

// 연인 초대 · 코드 연결 화면 (기능명세서 L9 연인 코드)
function useCoupleInvite() {
  const [state, setState] = useState<State>({ status: 'loading', code: null })
  const [attempt, setAttempt] = useState(0)
  // 같은 코드로 다시 시도할 때는 같은 멱등 키를 쓴다
  const join = useRef<{ code: string; key: string } | null>(null)

  useEffect(() => {
    let ignore = false

    loadInvite(createIdempotencyKey())
      .then((invite) => {
        if (!ignore) setState({ status: 'ready', code: invite.code })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: isAlreadyCoupled(error) ? 'linked' : 'error', code: null })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading', code: null })
    setAttempt((count) => count + 1)
  }

  // 성공하면 null, 실패하면 안내 문구
  const connect = async (input: string) => {
    const code = input.trim()
    if (join.current?.code !== code) join.current = { code, key: createIdempotencyKey() }

    try {
      await joinCouple(code, join.current.key)
      join.current = null
      return null
    } catch (error) {
      return (error instanceof ApiError && JOIN_ERRORS[error.code]) || JOIN_FALLBACK
    }
  }

  return { ...state, retry, connect }
}

export default useCoupleInvite
