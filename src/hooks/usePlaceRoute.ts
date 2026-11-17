import { useEffect, useState } from 'react'
import { createRoute } from '@/api/routes'
import type { PlaceSummary } from '@/types/place'
import type { Coordinate } from '@/types/route'
import { getCurrentCoordinate } from '@/utils/location'
import { decodePolyline } from '@/utils/polyline'
import { createIdempotencyKey } from '@/utils/share'

export interface PlaceRoute {
  path: Coordinate[]
  origin: Coordinate
  destination: Coordinate
  durationSeconds: number
}

// TODO: 장소 상세 응답의 previewRouteId가 항상 null이라 경로 설정 화면처럼 현재 위치에서 경로를 직접 만든다
function usePlaceRoute(place: PlaceSummary | null) {
  const [loaded, setLoaded] = useState<{ placeId: string; route: PlaceRoute } | null>(null)
  const placeId = place?.id ?? null
  const name = place?.name ?? ''
  const address = place?.address ?? ''
  const latitude = place?.coordinate.latitude
  const longitude = place?.coordinate.longitude

  useEffect(() => {
    if (!placeId || latitude === undefined || longitude === undefined) return
    let ignore = false

    getCurrentCoordinate()
      .then((coordinate) => {
        if (!coordinate) return null
        return createRoute(
          {
            origin: { placeId: null, name: '내 위치', address: '', coordinate },
            destination: { placeId, name, address, coordinate: { latitude, longitude } },
          },
          createIdempotencyKey(),
        )
      })
      .then((response) => {
        if (ignore || !response) return
        const { data } = response
        setLoaded({
          placeId,
          route: {
            path: decodePolyline(data.polyline),
            origin: data.origin.coordinate,
            destination: data.destination.coordinate,
            durationSeconds: data.durationSeconds,
          },
        })
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [placeId, name, address, latitude, longitude])

  return loaded && loaded.placeId === placeId ? loaded.route : null
}

export default usePlaceRoute
