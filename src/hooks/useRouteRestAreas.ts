import { useEffect, useMemo, useState } from 'react'
import { searchRestAreas } from '@/api/restAreas'
import type { RestArea } from '@/types/restArea'
import { decodePolyline } from '@/utils/polyline'
import { pathLength, pickAlongRoute, samplePath } from '@/utils/routeRestAreas'

const MIN_SPACING = 15_000
const MAX_SAMPLES = 12
const PER_SAMPLE = 10
const MAX_DISTANCE = 1000

// TODO: 경로 기준 휴게소 API가 없어 검색 API(주변 휴게소)로 경로 근처만 고른다. 진행 방향(상행·하행)은 구분하지 못함
function useRouteRestAreas(polyline: string | null) {
  const path = useMemo(() => (polyline ? decodePolyline(polyline) : []), [polyline])
  const [loaded, setLoaded] = useState<{ polyline: string; items: RestArea[] } | null>(null)

  useEffect(() => {
    if (!polyline || path.length < 2) return
    let ignore = false
    const spacing = Math.max(MIN_SPACING, pathLength(path) / (MAX_SAMPLES - 1))
    const points = samplePath(path, spacing).slice(0, MAX_SAMPLES)

    Promise.all(
      points.map((coordinate) =>
        searchRestAreas({ coordinate, limit: PER_SAMPLE })
          .then(({ data }) => data.items)
          .catch(() => []),
      ),
    ).then((pages) => {
      if (!ignore) setLoaded({ polyline, items: pickAlongRoute(path, pages.flat(), MAX_DISTANCE) })
    })

    return () => {
      ignore = true
    }
  }, [polyline, path])

  return loaded && loaded.polyline === polyline ? loaded.items : []
}

export default useRouteRestAreas
