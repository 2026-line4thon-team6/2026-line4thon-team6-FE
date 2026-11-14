import { useCallback, useEffect, useState } from 'react'
import { claimStamp, getStampBook } from '@/api/restAreas'
import type { Drive } from '@/types/drive'
import type { RestArea, StampBook, StampClaim } from '@/types/restArea'
import type { Coordinate } from '@/types/route'

// 도장판 전체(카탈로그)를 모든 페이지에 걸쳐 불러온다
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

// 휴게소 스탬프 탭: 도장판 · 도장 찍기
function useStamps(drive: Drive | null) {
  const [book, setBook] = useState<StampBook | null>(null)

  const reload = useCallback(() => {
    loadStampBook()
      .then(setBook)
      .catch(() => {})
  }, [])

  useEffect(reload, [reload])

  // GPS: 현재 위치로 찾은 휴게소 · MANUAL: 이름으로 검색한 휴게소
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
