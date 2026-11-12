import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { getActiveDrive, prepareDrive } from '@/api/drives'
import type { HomeSummary } from '@/types/home'
import { createIdempotencyKey } from '@/utils/share'

// /drive 로 넘기기
export interface DriveLocationState {
  destinationPlaceId?: string
}

// TODO: GET /home 연동 시 실제 id로 교체
const MY_USER_ID = 'usr_me'
const PARTNER_USER_ID = 'usr_partner'

function useStartDrive(couple: HomeSummary['couple']) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [state, setState] = useState<DriveLocationState>({})
  const submitting = useRef(false)
  const idempotencyKey = useRef<string | null>(null)

  const goDrive = (next: DriveLocationState) => navigate('/drive', { state: next })

  const start = async (destinationPlaceId?: string) => {
    // TODO: 커플 미연결 처리
    if (!couple) return
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
    if (!couple || submitting.current) return
    submitting.current = true
    idempotencyKey.current ??= createIdempotencyKey()

    try {
      await prepareDrive(
        {
          title: title || undefined,
          driverUserId: MY_USER_ID,
          passengerUserId: PARTNER_USER_ID,
          recorderUserId: MY_USER_ID,
        },
        { coupleId: couple.id, idempotencyKey: idempotencyKey.current },
      )
      idempotencyKey.current = null
      setSheetOpen(false)
      goDrive(state)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSheetOpen(false)
        goDrive(state)
      }
      // TODO: 실패 토스트
    } finally {
      submitting.current = false
    }
  }

  return { start, sheetOpen, closeSheet: () => setSheetOpen(false), submit }
}

export default useStartDrive
