import { useEffect, useState } from 'react'
import { getActiveDrive, updateDrive } from '@/api/drives'
import type { Drive } from '@/types/drive'

interface State {
  status: 'loading' | 'ready' | 'empty' | 'error'
  drive: Drive | null
}

// 진행 중인 드라이브를 불러오고 드라이브명을 바꾼다. 없으면 status='empty'
function useDrive() {
  const [state, setState] = useState<State>({ status: 'loading', drive: null })

  useEffect(() => {
    let ignore = false

    getActiveDrive()
      .then(({ data }) => {
        if (!ignore) setState({ status: data.drive ? 'ready' : 'empty', drive: data.drive })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', drive: null })
      })

    return () => {
      ignore = true
    }
  }, [])

  const update = async (change: { title?: string; routeId?: string }) => {
    const { drive } = state
    if (!drive) return false
    try {
      const { data } = await updateDrive(
        drive.id,
        { ...change, expectedVersion: drive.controlVersion },
        { coupleId: drive.coupleId },
      )
      setState({ status: 'ready', drive: data })
      return true
    } catch {
      return false
    }
  }

  const rename = (title: string) => update({ title })
  const setRoute = (routeId: string) => update({ routeId })

  return { ...state, rename, setRoute }
}

export default useDrive
