import { useEffect, useState } from 'react'
import { getTimeOfDay, type TimeOfDay } from '@/utils/timeOfDay'

const CHECK_INTERVAL_MS = 60_000

// 지금 시간대. 화면이 켜져 있는 동안 1분마다 확인해 시간대가 바뀌면 바꾼다
function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay)

  useEffect(() => {
    const timer = setInterval(() => setTimeOfDay(getTimeOfDay()), CHECK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return timeOfDay
}

export default useTimeOfDay
