import { useCallback, useEffect, useState } from 'react'
import { claimStamp, getStampBook } from '@/api/restAreas'
import type { Drive } from '@/types/drive'
import type { RestArea, StampBook, StampClaim } from '@/types/restArea'
import type { Coordinate } from '@/types/route'

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

function useStamps(drive: Drive | null) {
  const [book, setBook] = useState<StampBook | null>(null)

  const reload = useCallback(() => {
    loadStampBook()
      .then(setBook)
      .catch(() => {})
  }, [])

  useEffect(reload, [reload])

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
      return data
    } catch {
      return null
    }
  }

  return { book, claim }
}

export default useStamps
