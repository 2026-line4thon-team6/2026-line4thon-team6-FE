import { useEffect, useState } from 'react'
import { getActiveDrive } from '@/api/drives'

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
