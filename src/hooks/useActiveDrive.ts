import { useEffect, useState } from 'react'
import { getActiveDrive } from '@/api/drives'

// 남아 있는 드라이브. driving: 출발함(기록 중 · 일시정지) · preparing: 준비만 하고 나감 · none: 없음
export type ActiveDriveState = 'driving' | 'preparing' | 'none'

// 홈의 진행 중 드라이브 배너용. 준비만 하고 나간 드라이브도 커플 연결 해제를 막으므로 함께 알린다
function useActiveDrive(): ActiveDriveState {
  const [state, setState] = useState<ActiveDriveState>('none')

  useEffect(() => {
    let ignore = false
    getActiveDrive()
      .then(({ data }) => {
        const status = data.drive?.status
        if (ignore) return
        if (status === 'ACTIVE' || status === 'PAUSED') setState('driving')
        else if (status === 'PREPARING') setState('preparing')
        else setState('none')
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return state
}

export default useActiveDrive
