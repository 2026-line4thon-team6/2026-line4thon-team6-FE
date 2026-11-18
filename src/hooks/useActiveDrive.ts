import { useEffect, useState } from 'react'
import { getActiveDrive } from '@/api/drives'

// 남아 있는 드라이브. driving: 출발함(기록 중 · 일시정지) · preparing: 준비만 하고 나감 · none: 없음
export type ActiveDriveState = 'driving' | 'preparing' | 'none'

export interface ActiveDrive {
  state: ActiveDriveState
  routeId: string | null // 드라이브에 담긴(선택한) 경로. 홈 교통 상황 카드가 이 경로의 교통 상태를 보여준다
}

const NONE: ActiveDrive = { state: 'none', routeId: null }

// 홈의 진행 중 드라이브 배너용. 준비만 하고 나간 드라이브도 커플 연결 해제를 막으므로 함께 알린다
function useActiveDrive(): ActiveDrive {
  const [activeDrive, setActiveDrive] = useState<ActiveDrive>(NONE)

  useEffect(() => {
    let ignore = false
    getActiveDrive()
      .then(({ data }) => {
        if (ignore) return
        const drive = data.drive
        const status = drive?.status
        const state = status === 'ACTIVE' || status === 'PAUSED' ? 'driving' : status === 'PREPARING' ? 'preparing' : 'none'
        setActiveDrive(state === 'none' ? NONE : { state, routeId: drive?.routeId ?? null })
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return activeDrive
}

export default useActiveDrive
