import { useEffect, useRef } from 'react'
import type { Coordinate } from '@/types/route'
import { distanceMeters } from '@/utils/location'

export const ARRIVAL_RADIUS_METERS = 100
export const MAX_ACCURACY_METERS = 50
export const ARRIVAL_RETRY_MS = 30_000

interface UseArrivalOptions {
  active: boolean
  current: Coordinate | null
  accuracyMeters: number | null
  destination: Coordinate | null
  onArrive: () => Promise<boolean>
}

function useArrival({ active, current, accuracyMeters, destination, onArrive }: UseArrivalOptions) {
  const sending = useRef(false)
  const lastSentAt = useRef(-Infinity)

  const near =
    active &&
    current !== null &&
    destination !== null &&
    accuracyMeters !== null &&
    accuracyMeters <= MAX_ACCURACY_METERS &&
    distanceMeters(current, destination) <= ARRIVAL_RADIUS_METERS

  useEffect(() => {
    if (!near || sending.current || Date.now() - lastSentAt.current < ARRIVAL_RETRY_MS) return
    sending.current = true
    lastSentAt.current = Date.now()
    void onArrive().finally(() => {
      sending.current = false
    })
  }, [near, current, onArrive])
}

export default useArrival
