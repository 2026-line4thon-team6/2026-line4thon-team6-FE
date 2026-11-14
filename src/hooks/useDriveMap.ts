import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRoute } from '@/api/routes'
import type { Route } from '@/types/route'
import { getCurrentCoordinate, type Position, requestPosition, watchPosition } from '@/utils/location'
import { decodePolyline } from '@/utils/polyline'

function useDriveMap(routeId: string | null) {
  const [position, setPosition] = useState<Position | null>(null)
  const [route, setRoute] = useState<{ id: string; data: Route } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  // 권한이 거부되면 브라우저가 watch를 멈추므로, 다시 허용되면 새로 건다
  const [watchKey, setWatchKey] = useState(0)

  const locate = useCallback(async () => {
    const coordinate = await getCurrentCoordinate()
    if (coordinate) setPosition((prev) => ({ coordinate, accuracyMeters: prev?.accuracyMeters ?? Infinity }))
  }, [])

  useEffect(
    () =>
      watchPosition(
        (next) => {
          setPosition(next)
          setLocationDenied(false)
        },
        () => setLocationDenied(true),
      ),
    [watchKey],
  )

  // 허용되면 true
  const retryLocation = useCallback(async () => {
    const next = await requestPosition()
    if (!next) return false
    setPosition(next)
    setLocationDenied(false)
    setWatchKey((key) => key + 1)
    return true
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

  return {
    current: position?.coordinate ?? null,
    accuracyMeters: position?.accuracyMeters ?? null,
    path,
    origin: loaded?.origin.coordinate ?? null,
    destination: loaded?.destination.coordinate ?? null,
    locationDenied,
    locate,
    retryLocation,
  }
}

export default useDriveMap
