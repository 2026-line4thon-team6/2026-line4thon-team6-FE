import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRoute } from '@/api/routes'
import type { Coordinate, Route } from '@/types/route'
import { getCurrentCoordinate } from '@/utils/location'
import { decodePolyline } from '@/utils/polyline'

// 드라이브 지도에 그릴 현재 위치와 저장된 경로
// TODO: 주행 중 GPS 전송을 붙이면 watchPosition으로 현재 위치를 계속 갱신한다
function useDriveMap(routeId: string | null) {
  const [current, setCurrent] = useState<Coordinate | null>(null)
  const [route, setRoute] = useState<{ id: string; data: Route } | null>(null)

  const locate = useCallback(async () => {
    const coordinate = await getCurrentCoordinate()
    if (coordinate) setCurrent(coordinate)
  }, [])

  useEffect(() => {
    let ignore = false
    void getCurrentCoordinate().then((coordinate) => {
      if (!ignore && coordinate) setCurrent(coordinate)
    })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!routeId) return
    let ignore = false
    getRoute(routeId)
      .then(({ data }) => {
        if (!ignore) setRoute({ id: routeId, data })
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [routeId])

  const loaded = route && route.id === routeId ? route.data : null
  const path = useMemo(() => (loaded ? decodePolyline(loaded.polyline) : []), [loaded])

  return { current, path, destination: loaded?.destination.coordinate ?? null, locate }
}

export default useDriveMap
