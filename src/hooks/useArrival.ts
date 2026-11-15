import { useEffect, useRef } from 'react'

export const ARRIVAL_RETRY_MS = 30_000

interface UseArrivalOptions {
  active: boolean
  arrived: boolean
  onArrive: () => Promise<boolean>
}

function useArrival({ active, arrived, onArrive }: UseArrivalOptions) {
  const sending = useRef(false)
  const lastSentAt = useRef(-Infinity)

  useEffect(() => {
    if (!active || !arrived || sending.current || Date.now() - lastSentAt.current < ARRIVAL_RETRY_MS) return
    sending.current = true
    lastSentAt.current = Date.now()
    void onArrive().finally(() => {
      sending.current = false
    })
  }, [active, arrived, onArrive])
}

export default useArrival
