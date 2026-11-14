import { useState } from 'react'
import type { RestArea } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import { distanceMeters } from '@/utils/location'

export const APPROACH_METERS = 2000

export interface RestAreaAlert {
  restArea: RestArea
  meters: number
}

// TODO: GPS 전송을 붙이면 업로드 응답의 restAreaAlerts를 쓴다
function useRestAreaAlert(restAreas: RestArea[], current: Coordinate | null, active: boolean) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  let alert: RestAreaAlert | null = null
  if (active && current) {
    for (const restArea of restAreas) {
      if (dismissed.has(restArea.id) || (restArea.distanceAlongRouteMeters ?? 1) <= 0) continue
      const meters = distanceMeters(current, restArea.coordinate)
      if (meters <= APPROACH_METERS && (!alert || meters < alert.meters)) alert = { restArea, meters }
    }
  }

  const dismiss = (restAreaId: string) => setDismissed((prev) => new Set(prev).add(restAreaId))

  return { alert, dismiss }
}

export default useRestAreaAlert
