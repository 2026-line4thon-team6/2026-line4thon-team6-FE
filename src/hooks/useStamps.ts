import { useCallback, useEffect, useRef, useState } from 'react'
import { claimStamp, getStampBook, getStampClaim } from '@/api/restAreas'
import type { Drive } from '@/types/drive'
import type { RestArea, StampBook, StampClaim } from '@/types/restArea'
import type { Coordinate } from '@/types/route'

const PENDING_POLL_SECONDS = 10

async function loadStampBook(): Promise<StampBook> {
  const { data: first } = await getStampBook({ limit: 100 })
  const items = [...first.items]
  let page = first
  while (page.hasMore && page.nextCursor) {
    page = (await getStampBook({ cursor: page.nextCursor, limit: 100 })).data
    items.push(...page.items)
  }
  return { ...first, items, nextCursor: null, hasMore: false }
}

function useStamps(drive: Drive | null, onSettled?: (claim: StampClaim) => void) {
  const [book, setBook] = useState<StampBook | null>(null)
  const [pending, setPending] = useState<StampClaim[]>([])
  const settledRef = useRef(onSettled)

  useEffect(() => {
    settledRef.current = onSettled
  })

  const reload = useCallback(() => {
    loadStampBook()
      .then(setBook)
      .catch(() => {})
  }, [])

  useEffect(reload, [reload])

  useEffect(() => {
    if (pending.length === 0) return
    const delay = Math.min(...pending.map((claim) => claim.retryAfterSeconds ?? PENDING_POLL_SECONDS)) * 1000
    let ignore = false
    const timer = setTimeout(async () => {
      const results = await Promise.all(
        pending.map((claim) =>
          getStampClaim(claim.id)
            .then(({ data }) => data)
            .catch(() => claim),
        ),
      )
      if (ignore) return
      const settled = results.filter((claim) => claim.status !== 'PENDING')
      if (settled.some((claim) => claim.status === 'VERIFIED')) reload()
      settled.forEach((claim) => settledRef.current?.(claim))
      setPending(results.filter((claim) => claim.status === 'PENDING'))
    }, delay)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [pending, reload])

  const claim = async (
    restArea: RestArea,
    method: 'GPS' | 'MANUAL',
    coordinate: Coordinate | null,
  ): Promise<StampClaim | null> => {
    if (!drive) return null
    try {
      const { data } = await claimStamp(
        drive.id,
        {
          restAreaId: restArea.id,
          method,
          ...(coordinate ? { coordinate, observedAt: new Date().toISOString() } : {}),
        },
        { coupleId: drive.coupleId, idempotencyKey: crypto.randomUUID() },
      )
      if (data.status === 'VERIFIED') reload()
      if (data.status === 'PENDING') setPending((prev) => [...prev.filter(({ id }) => id !== data.id), data])
      return data
    } catch {
      return null
    }
  }

  return { book, claim }
}

export default useStamps
