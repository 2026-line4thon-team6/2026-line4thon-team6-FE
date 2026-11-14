import { useState } from 'react'
import type { RestArea } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import { distanceMeters } from '@/utils/location'

// 백엔드 접근 알림 기준(APPROACH_METERS)과 같다
export const APPROACH_METERS = 2000

export interface RestAreaAlert {
  restArea: RestArea
  meters: number
}

// 기능명세 04 ⑤: 앞쪽 휴게소에 2km 안으로 가까워지면 알린다. 닫은 휴게소는 다시 알리지 않는다
// TODO: GPS 전송을 붙이면 업로드 응답의 restAreaAlerts를 쓴다
function useRestAreaAlert(restAreas: RestArea[], current: Coordinate | null, active: boolean) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  let alert: RestAreaAlert | null = null
  if (active && current) {
    for (const restArea of restAreas) {
      // 경로상 남은 거리가 0 이하면 이미 지나친 휴게소다
      if (dismissed.has(restArea.id) || (restArea.distanceAlongRouteMeters ?? 1) <= 0) continue
      const meters = distanceMeters(current, restArea.coordinate)
      if (meters <= APPROACH_METERS && (!alert || meters < alert.meters)) alert = { restArea, meters }
    }
  }

  const dismiss = (restAreaId: string) => setDismissed((prev) => new Set(prev).add(restAreaId))

  return { alert, dismiss }
}

export default useRestAreaAlert
