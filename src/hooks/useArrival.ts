import { useEffect, useRef } from 'react'
import type { Coordinate } from '@/types/route'
import { distanceMeters } from '@/utils/location'

// 서버도 같은 기준(반경 100m · 정확도 50m 이하)으로 도착을 다시 검사한다 (API 명세 D03)
export const ARRIVAL_RADIUS_METERS = 100
export const MAX_ACCURACY_METERS = 50
// 서버가 아직 도착이 아니라고 하면(체류 시간 부족 등) 잠시 뒤 다시 보낸다
export const ARRIVAL_RETRY_MS = 30_000

interface UseArrivalOptions {
  active: boolean
  current: Coordinate | null
  accuracyMeters: number | null
  destination: Coordinate | null
  // 도착으로 마쳤으면 true
  onArrive: () => Promise<boolean>
}

// 기능명세 17: 목적지에 도착하면 자동으로 드라이브를 마친다
function useArrival({ active, current, accuracyMeters, destination, onArrive }: UseArrivalOptions) {
  const sending = useRef(false)
  const lastSentAt = useRef(-Infinity)

  const near =
    active &&
    current !== null &&
    destination !== null &&
    accuracyMeters !== null &&
    accuracyMeters <= MAX_ACCURACY_METERS &&
    distanceMeters(current, destination) <= ARRIVAL_RADIUS_METERS

  useEffect(() => {
    if (!near || sending.current || Date.now() - lastSentAt.current < ARRIVAL_RETRY_MS) return
    sending.current = true
    lastSentAt.current = Date.now()
    void onArrive().finally(() => {
      sending.current = false
    })
  }, [near, current, onArrive])
}

export default useArrival
