import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import {
  cancelPreparedDrive,
  endDrive,
  getActiveDrive,
  pauseDrive,
  resumeDrive,
  startDrive,
  updateDrive,
} from '@/api/drives'
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

  // 실패하면 이유를 돌려준다. RECORDER_ONLY: 드라이브를 만든 사람(기록 사용자)만 출발할 수 있다
  const start = async (): Promise<'started' | 'NO_LOCATION' | 'RECORDER_ONLY' | 'FAILED'> => {
    const drive = latest.current
    if (!drive) return 'FAILED'
    const coordinate = await getCurrentCoordinate()
    if (!coordinate) return 'NO_LOCATION'
    try {
      const { data } = await startDrive(
        drive.id,
        { expectedVersion: drive.controlVersion, initialCoordinate: coordinate },
        options(drive),
      )
      latest.current = data
      setState({ status: 'ready', drive: data })
      return 'started'
    } catch (error) {
      return error instanceof ApiError && error.status === 403 ? 'RECORDER_ONLY' : 'FAILED'
    }
  }

  // 출발 전 드라이브를 없앤다. 그사이 상태가 바뀌었으면(409) 최신 드라이브를 다시 받는다
  const cancel = async () => {
    const drive = latest.current
    if (!drive) return false
    try {
      const { data } = await cancelPreparedDrive(drive.id, { expectedVersion: drive.controlVersion }, options(drive))
      latest.current = data
      setState({ status: 'ready', drive: data })
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const { data } = await getActiveDrive().catch(() => ({ data: { drive } }))
        latest.current = data.drive
        setState({ status: data.drive ? 'ready' : 'empty', drive: data.drive })
      }
      return false
    }
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

  return { ...state, rename, setRoute, start, cancel, pause, resume, end, sync }
}

export default useDrive
