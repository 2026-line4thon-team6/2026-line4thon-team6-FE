import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { fetchMyCouple } from '@/api/couples'
import { getActiveDrive, prepareDrive } from '@/api/drives'
import type { Couple } from '@/types/couple'
import { createIdempotencyKey } from '@/utils/share'

export interface DriveLocationState {
  destinationPlaceId?: string
  destinationName?: string
}

const START_FAILED = '드라이브를 시작하지 못했어요. 다시 시도해 주세요.'

function useStartDrive(myUserId: string) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  // 실패를 알리는 토스트 문구 (화면에서 Toast로 띄운다)
  const [toast, setToast] = useState<string | null>(null)
  const [state, setState] = useState<DriveLocationState>({})
  const couple = useRef<Couple | null>(null)
  const submitting = useRef(false)
  const idempotencyKey = useRef<string | null>(null)

  const goDrive = (next: DriveLocationState) => navigate('/drive', { state: next })

  const start = async (destinationPlaceId?: string) => {
    const connection = await fetchMyCouple().catch(() => null)
    // 연결 상태를 모르면 초대 화면으로 보내지 않는다 (연결된 사용자가 네트워크 오류로 초대 화면에 가지 않게)
    if (!connection) {
      setToast(START_FAILED)
      return
    }
    couple.current = connection.data.connectionStatus === 'CONNECTED' ? connection.data.couple : null
    // 드라이브는 연인과 함께 기록하므로, 연결 전이면 장소 상세의 '연인에게 보내기'처럼 연인 초대 화면으로 보낸다
    if (!couple.current) {
      navigate('/couple/invite')
      return
    }
    const next = destinationPlaceId ? { destinationPlaceId } : {}

    const active = await getActiveDrive().catch(() => null)
    if (active?.data.drive) {
      goDrive(next)
      return
    }
    setState(next)
    setSheetOpen(true)
  }

  const submit = async (title: string) => {
    const current = couple.current
    const partner = current?.members.find((member) => member.id !== myUserId)
    if (!current || !partner || submitting.current) return
    submitting.current = true
    idempotencyKey.current ??= createIdempotencyKey()

    try {
      await prepareDrive(
        {
          title: title || undefined,
          driverUserId: myUserId,
          passengerUserId: partner.id,
          recorderUserId: myUserId,
        },
        { coupleId: current.id, idempotencyKey: idempotencyKey.current },
      )
      idempotencyKey.current = null
      setSheetOpen(false)
      goDrive(state)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSheetOpen(false)
        goDrive(state)
        return
      }
      // 시트는 열어 둬 입력한 이름 그대로 다시 출발할 수 있게 한다 (같은 멱등 키로 재시도)
      setToast(START_FAILED)
    } finally {
      submitting.current = false
    }
  }

  return { start, sheetOpen, closeSheet: () => setSheetOpen(false), submit, toast, clearToast: () => setToast(null) }
}

export default useStartDrive
