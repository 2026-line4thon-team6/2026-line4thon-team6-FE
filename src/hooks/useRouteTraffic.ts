import { useEffect, useState } from 'react'
import { getRoute } from '@/api/routes'
import type { TrafficStatus } from '@/types/route'

const TRAFFIC_LABELS: Record<TrafficStatus, string> = {
  SMOOTH: '원활',
  SLOW: '서행',
  CONGESTED: '정체',
  BLOCKED: '통행 불가',
}

// 홈 교통 상황 카드: 선택한 경로 응답의 trafficSummary.status를 글자로 바꾼다.
// 경로가 없거나, 교통 요약이 null이거나, 경로를 불러오지 못하면(만료 등) null → 화면은 '--'
function useRouteTraffic(routeId: string | null): string | null {
  const [traffic, setTraffic] = useState<{ routeId: string; label: string | null } | null>(null)

  useEffect(() => {
    if (!routeId) return
    let ignore = false
    getRoute(routeId)
      .then(({ data }) => {
        if (!ignore) setTraffic({ routeId, label: data.trafficSummary ? TRAFFIC_LABELS[data.trafficSummary.status] : null })
      })
      .catch(() => {
        if (!ignore) setTraffic({ routeId, label: null })
      })
    return () => {
      ignore = true
    }
  }, [routeId])

  // 다른 경로의 결과는 쓰지 않는다 (경로가 바뀌거나 없어진 순간 바로 '--')
  return routeId && traffic?.routeId === routeId ? traffic.label : null
}

export default useRouteTraffic
