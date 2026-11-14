import { useEffect, useState } from 'react'
import { searchRestAreas } from '@/api/restAreas'
import type { RestArea } from '@/types/restArea'
import type { Coordinate } from '@/types/route'

const SEARCH_DELAY_MS = 300

// 휴게소 이름 검색. 위치를 알면 거리와 함께 가까운 순으로 받는다
function useRestAreaSearch(coordinate: Coordinate | null) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ keyword: string; items: RestArea[] } | null>(null)
  const keyword = query.trim()

  useEffect(() => {
    if (!keyword) return
    let ignore = false
    const timer = setTimeout(() => {
      searchRestAreas({ q: keyword, coordinate: coordinate ?? undefined })
        .then(({ data }) => !ignore && setResults({ keyword, items: data.items }))
        .catch(() => !ignore && setResults({ keyword, items: [] }))
    }, SEARCH_DELAY_MS)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [keyword, coordinate])

  return { query, setQuery, results: keyword && results?.keyword === keyword ? results.items : null }
}

export default useRestAreaSearch
