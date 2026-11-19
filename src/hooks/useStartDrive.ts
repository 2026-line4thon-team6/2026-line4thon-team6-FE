import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { fetchMyCouple } from '@/api/couples'
import { getActiveDrive, prepareDrive, startDrive } from '@/api/drives'
import { fetchPlaceDetail } from '@/api/places'
import { createRoute } from '@/api/routes'
import type { Couple } from '@/types/couple'
import type { Coordinate, RoutePoint } from '@/types/route'
import { getCurrentCoordinate } from '@/utils/location'
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
  // 장소 상세에서 시작하면 그 장소로 바로 경로 안내를 시작한다
  const destination = useRef<RoutePoint | null>(null)
  const couple = useRef<Couple | null>(null)
  const submitting = useRef(false)
  const idempotencyKey = useRef<string | null>(null)

  const goDrive = (next: DriveLocationState) => navigate('/drive', { state: next })

  // destinationPoint: 장소 상세가 이미 아는 목적지(이름 · 주소 · 좌표). 없으면 장소 id로 불러온다
  const start = async (destinationPlaceId?: string, destinationPoint?: RoutePoint) => {
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
    destination.current = destinationPlaceId ? (destinationPoint ?? null) : null

    const active = await getActiveDrive().catch(() => null)
    if (active?.data.drive) {
      goDrive(next)
      return
    }
    setState(next)
    setSheetOpen(true)
  }

  // 현재 위치에서 목적지까지 경로를 만든다. 위치를 모르거나 만들지 못하면 null (경로 설정 화면에서 직접 고른다)
  const routeToDestination = async (): Promise<{ routeId: string; here: Coordinate } | null> => {
    if (!state.destinationPlaceId) return null
    try {
      const here = await getCurrentCoordinate()
      if (!here) return null
      let point = destination.current
      if (!point) {
        const { data } = await fetchPlaceDetail(state.destinationPlaceId)
        point = { placeId: data.place.id, name: data.place.name, address: data.place.address, coordinate: data.place.coordinate }
      }
      const { data } = await createRoute(
        { origin: { placeId: null, name: '내 위치', address: '', coordinate: here }, destination: point },
        createIdempotencyKey(),
      )
      return { routeId: data.id, here }
    } catch {
      return null
    }
  }

  const submit = async (title: string) => {
    const current = couple.current
    const partner = current?.members.find((member) => member.id !== myUserId)
    if (!current || !partner || submitting.current) return
    submitting.current = true
    idempotencyKey.current ??= createIdempotencyKey()

    try {
      // 장소로 출발하면 경로를 먼저 만들어 드라이브에 함께 담는다
      const routed = await routeToDestination()
      const { data: prepared } = await prepareDrive(
        {
          title: title || undefined,
          driverUserId: partner.id,
          passengerUserId: myUserId,
          recorderUserId: myUserId,
          routeId: routed?.routeId,
        },
        { coupleId: current.id, idempotencyKey: idempotencyKey.current },
      )
      idempotencyKey.current = null
      setSheetOpen(false)
      if (!state.destinationPlaceId) return goDrive(state)
      // 경로가 있으면 바로 출발해 경로 안내를 시작한다. 경로 없이 만들었거나 출발하지 못하면
      // 목적지를 채운 경로 설정 화면에서 직접 출발한다
      const started =
        routed &&
        (await startDrive(
          prepared.id,
          { expectedVersion: prepared.controlVersion, initialCoordinate: routed.here },
          { coupleId: current.id, idempotencyKey: createIdempotencyKey() },
        )
          .then(() => true)
          .catch(() => false))
      if (started) navigate('/drive')
      else navigate('/drive/route', { state })
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
