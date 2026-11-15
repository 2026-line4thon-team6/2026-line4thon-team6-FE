import { useEffect, useRef, useState } from 'react'
import { endDrive, getActiveDrive, pauseDrive, resumeDrive, startDrive, updateDrive } from '@/api/drives'
import type { Drive, DriveEndReason } from '@/types/drive'
import { getCurrentCoordinate } from '@/utils/location'

interface State {
  status: 'loading' | 'ready' | 'empty' | 'error'
  drive: Drive | null
}

function useDrive() {
  const [state, setState] = useState<State>({ status: 'loading', drive: null })
  const latest = useRef<Drive | null>(null)

  useEffect(() => {
    let ignore = false

    getActiveDrive()
      .then(({ data }) => {
        if (ignore) return
        latest.current = data.drive
        setState({ status: data.drive ? 'ready' : 'empty', drive: data.drive })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', drive: null })
      })

    return () => {
      ignore = true
    }
  }, [])

  const run = async (request: (drive: Drive) => Promise<{ data: Drive }>) => {
    const drive = latest.current
    if (!drive) return null
    try {
      const { data } = await request(drive)
      latest.current = data
      setState({ status: 'ready', drive: data })
      return data
    } catch {
      return null
    }
  }

  const options = (drive: Drive) => ({ coupleId: drive.coupleId, idempotencyKey: crypto.randomUUID() })

  const update = async (change: { title?: string; routeId?: string }) =>
    (await run((drive) =>
      updateDrive(drive.id, { ...change, expectedVersion: drive.controlVersion }, { coupleId: drive.coupleId }),
    )) !== null

  const rename = (title: string) => update({ title })
  const setRoute = (routeId: string) => update({ routeId })

  const start = async () => {
    const coordinate = await getCurrentCoordinate()
    if (!coordinate) return null
    return run((drive) =>
      startDrive(drive.id, { expectedVersion: drive.controlVersion, initialCoordinate: coordinate }, options(drive)),
    )
  }

  const pause = () => run((drive) => pauseDrive(drive.id, { expectedVersion: drive.controlVersion }, options(drive)))
  const resume = () => run((drive) => resumeDrive(drive.id, { expectedVersion: drive.controlVersion }, options(drive)))

  const end = (reason: DriveEndReason, lastRecordedSequence = 0) =>
    run((drive) =>
      endDrive(drive.id, { expectedVersion: drive.controlVersion, reason, lastRecordedSequence }, options(drive)),
    )

  const sync = (next: Drive) => {
    const drive = latest.current
    if (!drive || drive.id !== next.id || next.controlVersion < drive.controlVersion) return
    latest.current = next
    setState({ status: 'ready', drive: next })
  }

  return { ...state, rename, setRoute, start, pause, resume, end, sync }
}

export default useDrive
