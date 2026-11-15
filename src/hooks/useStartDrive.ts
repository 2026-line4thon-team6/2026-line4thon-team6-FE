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

function useStartDrive(myUserId: string) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [state, setState] = useState<DriveLocationState>({})
  const couple = useRef<Couple | null>(null)
  const submitting = useRef(false)
  const idempotencyKey = useRef<string | null>(null)

  const goDrive = (next: DriveLocationState) => navigate('/drive', { state: next })

  const start = async (destinationPlaceId?: string) => {
    const connection = await fetchMyCouple().catch(() => null)
    couple.current = connection?.data.connectionStatus === 'CONNECTED' ? connection.data.couple : null
    // TODO: 커플 미연결 처리
    if (!couple.current) return
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
      }
      // TODO: 실패 토스트
    } finally {
      submitting.current = false
    }
  }

  return { start, sheetOpen, closeSheet: () => setSheetOpen(false), submit }
}

export default useStartDrive
