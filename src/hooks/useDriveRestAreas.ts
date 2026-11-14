import { useEffect, useState } from 'react'
import { getDriveRestAreas } from '@/api/restAreas'
import type { RestArea } from '@/types/restArea'

const REFRESH_MS = 60_000

function useDriveRestAreas(driveId: string | null, routeId: string | null, active: boolean) {
  const [loaded, setLoaded] = useState<{ routeId: string; items: RestArea[] } | null>(null)

  useEffect(() => {
    if (!driveId || !routeId) return
    let ignore = false
    const load = () =>
      getDriveRestAreas(driveId, { limit: 50 })
        .then(({ data }) => !ignore && setLoaded({ routeId, items: data.items }))
        .catch(() => {})
    void load()
    const timer = active ? setInterval(() => void load(), REFRESH_MS) : undefined
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [driveId, routeId, active])

  return loaded && loaded.routeId === routeId ? loaded.items : []
}

export default useDriveRestAreas
