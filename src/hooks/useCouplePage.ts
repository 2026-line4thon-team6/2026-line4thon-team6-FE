import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { disconnectCouple, fetchMyCouple, fetchMyInvite, renameMascot as renameMascotApi, updateCoupleStartDate } from '@/api/couples'
import { fetchMe, updateMe } from '@/api/me'
import type { Couple } from '@/types/couple'
import type { Me, UpdateMeRequest } from '@/types/me'

const MESSAGES = {
  conflict: '연인이 먼저 정보를 바꿨어요. 새로 불러온 정보를 확인해 주세요.',
  activeDrive: '진행 중인 드라이브를 먼저 끝낸 뒤 해제해 주세요.',
  unknown: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

interface State {
  // unlinked: 연결된 커플이 없음 (해제했거나 연결 전)
  status: 'loading' | 'ready' | 'error' | 'unlinked'
  couple: Couple | null
  me: Me | null
  inviteCode: string | null // 불러오지 못하면 null
}

const INITIAL: State = { status: 'loading', couple: null, me: null, inviteCode: null }

const toMessage = (reason: unknown) => (reason instanceof ApiError ? reason.message : MESSAGES.unknown)

// 커플 페이지 데이터와 수정 동작 (시작일 · 붕붕이명 · 내 정보 · 연결 해제)
// 수정 함수는 성공하면 null, 실패하면 화면에 보여 줄 안내 문구를 돌려준다
function useCouplePage() {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)
  // 연속 요청에서 최신 버전을 쓰기 위해 화면 상태와 별도로 들고 있는다
  const coupleRef = useRef<Couple | null>(null)

  useEffect(() => {
    let ignore = false

    Promise.all([fetchMyCouple(), fetchMe(), fetchMyInvite().catch(() => null)])
      .then(([{ data: connection }, { data: me }, invite]) => {
        if (ignore) return
        const couple = connection.connectionStatus === 'CONNECTED' ? connection.couple : null
        coupleRef.current = couple
        setState({
          status: couple ? 'ready' : 'unlinked',
          couple,
          me,
          inviteCode: invite?.data.code ?? null,
        })
      })
      .catch(() => {
        if (!ignore) setState({ ...INITIAL, status: 'error' })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  const setCouple = (couple: Couple) => {
    coupleRef.current = couple
    setState((prev) => ({ ...prev, couple }))
  }

  // 커플 정보 수정 공통: 버전 충돌이면 다시 불러오고 안내 문구를 돌려준다
  const updateCouple = async (request: (couple: Couple) => Promise<{ data: Couple }>) => {
    const couple = coupleRef.current
    if (!couple) return MESSAGES.unknown
    try {
      const { data } = await request(couple)
      setCouple(data)
      return null
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'VERSION_CONFLICT') {
        const { data } = await fetchMyCouple().catch(() => ({ data: null }))
        if (data?.couple) setCouple(data.couple)
        return MESSAGES.conflict
      }
      return toMessage(reason)
    }
  }

  const changeStartDate = (startDate: string) =>
    updateCouple((couple) => updateCoupleStartDate(startDate, couple.version, { coupleId: couple.id }))

  const renameMascot = (name: string) =>
    updateCouple((couple) => renameMascotApi(name, couple.version, { coupleId: couple.id }))

  // 내 정보를 바꾸면 커플 멤버 목록의 내 정보도 같이 바꾼다
  const updateProfile = async (body: UpdateMeRequest) => {
    try {
      const { data: me } = await updateMe(body)
      const couple = coupleRef.current
      const next = couple && {
        ...couple,
        members: couple.members.map((member) =>
          member.id === me.id ? { ...member, nickname: me.nickname, birthDate: me.birthDate } : member,
        ),
      }
      coupleRef.current = next
      setState((prev) => ({ ...prev, me, couple: next }))
      return null
    } catch (reason) {
      return toMessage(reason)
    }
  }

  const disconnect = async () => {
    const couple = coupleRef.current
    if (!couple) return MESSAGES.unknown
    try {
      await disconnectCouple({ coupleId: couple.id })
      return null
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'ACTIVE_DRIVE_EXISTS') return MESSAGES.activeDrive
      return toMessage(reason)
    }
  }

  return { ...state, retry, changeStartDate, renameMascot, updateProfile, disconnect }
}

export default useCouplePage
