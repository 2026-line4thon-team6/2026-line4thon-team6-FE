import { useCallback, useEffect, useState } from 'react'
import { fetchRadioHistory } from '@/api/radio'
import type { RadioEpisode } from '@/types/radio'
import useCursorList from './useCursorList'

// 입력을 멈추고 이만큼 지나면 검색한다 (글자마다 요청하지 않게)
const SEARCH_DELAY_MS = 300

// 라디오 사연 보관함 · 검색 (GET /radio/episodes?q=). 보관함 화면과 주행 중 사연 목록 서랍이 함께 쓴다
function useRadioStories() {
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')

  // 앞뒤 공백을 뺀 검색어가 바뀌었을 때만 검색한다
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])

  // 검색어가 바뀌면 새 함수가 되어 첫 페이지부터 다시 불러오고, 이전 검색어의 늦은 응답은 버린다
  const fetchPage = useCallback((cursor: string | undefined) => fetchRadioHistory(keyword, { cursor }), [keyword])
  const list = useCursorList<RadioEpisode>(fetchPage)

  return {
    // 새 검색 결과가 올 때까지는 이전 결과를 그대로 보여 준다
    status: list.status,
    episodes: list.items,
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    query,
    setQuery,
    keyword,
    loadMore: list.loadMore,
    retry: list.retry,
  }
}

export default useRadioStories
