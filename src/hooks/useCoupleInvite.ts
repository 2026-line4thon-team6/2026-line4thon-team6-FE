import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { createCoupleInvite, fetchMyInvite, joinCouple, restoreCouple } from '@/api/couples'
import type { CoupleJoinResult } from '@/types/couple'
import { createIdempotencyKey } from '@/utils/share'

interface State {
  // linked: 이미 연인과 연결돼 있어 새 코드를 쓸 수 없다
  status: 'loading' | 'ready' | 'error' | 'linked'
  code: string | null
}

// POST /couples · POST /couples/restore 오류 코드별 안내 (API 명세 422 · 409 · 404)
const JOIN_ERRORS: Record<string, string> = {
  VALIDATION_FAILED: '연인의 코드를 입력해 주세요.',
  INVALID_INVITE: '코드를 다시 확인해 주세요.',
  SELF_INVITE: '내 코드는 입력할 수 없어요. 연인의 코드를 입력해 주세요.',
  // 두 사람 중 누군가 가입할 때 고른 만난 날이 오늘 이후인 경우
  INVALID_START_DATE: '만난 날이 오늘 이후로 되어 있어 연결하지 못했어요.',
  INVITE_CONSUMED: '이미 사용된 코드예요. 연인에게 새 코드를 받아 주세요.',
  ALREADY_COUPLED: '이미 연인과 연결되어 있어요.',
  // 같은 멱등 키를 다른 요청에 썼을 때. 다음 시도는 새 키로 보낸다
  IDEMPOTENCY_KEY_REUSED: '연결하지 못했어요. 다시 시도해 주세요.',
  COUPLE_HISTORY_NOT_FOUND: '다시 연결할 예전 연결 정보가 없어요. 연인의 새 코드를 확인해 주세요.',
}
const JOIN_FALLBACK = '연결하지 못했어요. 잠시 후 다시 시도해 주세요.'

const errorCode = (error: unknown) => (error instanceof ApiError ? error.code : null)
const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404
const toJoinMessage = (error: unknown) => JOIN_ERRORS[errorCode(error) ?? ''] || JOIN_FALLBACK

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

type Attempt = { code: string; key: string } | null

// 같은 코드로 다시 시도할 때는 같은 멱등 키를, 코드가 바뀌면 새 키를 쓴다
function keyFor(attempt: { current: Attempt }, code: string) {
  if (attempt.current?.code !== code) attempt.current = { code, key: createIdempotencyKey() }
  return attempt.current.key
}

// 연인 초대 · 코드 연결 화면 (기능명세서 L9 연인 코드)
function useCoupleInvite() {
  const [state, setState] = useState<State>({ status: 'loading', code: null })
  const [attempt, setAttempt] = useState(0)
  // 서버는 연결과 복구를 다른 요청으로 보므로 멱등 키를 따로 들고 있는다
  const join = useRef<Attempt>(null)
  const restoration = useRef<Attempt>(null)

  useEffect(() => {
    let ignore = false

    loadInvite(createIdempotencyKey())
      .then((invite) => {
        if (!ignore) setState({ status: 'ready', code: invite.code })
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ status: errorCode(error) === 'ALREADY_COUPLED' ? 'linked' : 'error', code: null })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading', code: null })
    setAttempt((count) => count + 1)
  }

  // 예전에 연결했던 연인이면(409 COUPLE_RESTORE_REQUIRED) 다시 연결할지 물어보도록 restore를 돌려준다
  const connect = async (input: string): Promise<CoupleJoinResult> => {
    const code = input.trim()
    try {
      await joinCouple(code, keyFor(join, code))
      join.current = null
      return { status: 'connected' }
    } catch (error) {
      if (errorCode(error) === 'COUPLE_RESTORE_REQUIRED') return { status: 'restore' }
      if (errorCode(error) === 'IDEMPOTENCY_KEY_REUSED') join.current = null
      return { status: 'failed', message: toJoinMessage(error) }
    }
  }

  // 예전 커플 연결을 되살린다. 성공하면 null, 실패하면 안내 문구
  const restore = async (input: string) => {
    const code = input.trim()
    try {
      await restoreCouple(code, keyFor(restoration, code))
      restoration.current = null
      return null
    } catch (error) {
      if (errorCode(error) === 'IDEMPOTENCY_KEY_REUSED') restoration.current = null
      return toJoinMessage(error)
    }
  }

  return { ...state, retry, connect, restore }
}

export default useCoupleInvite
