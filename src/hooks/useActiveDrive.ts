import { useEffect, useState } from 'react'
import { getActiveDrive } from '@/api/drives'

// 주행 중(일시정지 포함)인 드라이브가 있는지. 홈에 들어올 때마다 다시 확인한다
function useActiveDrive() {
  const [driving, setDriving] = useState(false)

  useEffect(() => {
    let ignore = false
    getActiveDrive()
      .then(({ data }) => {
        const status = data.drive?.status
        if (!ignore) setDriving(status === 'ACTIVE' || status === 'PAUSED')
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return driving
}

export default useActiveDrive
