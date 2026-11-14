import { useEffect, useRef, useState } from 'react'
import { fetchPlaceDetail } from '@/api/places'
import { createRoute } from '@/api/routes'
import { deleteSearchHistory, getSearchHistory, reverseGeocode, saveSearchHistory, searchPlaces } from '@/api/search'
import type { PlaceSummary } from '@/types/place'
import type { Route, RoutePoint } from '@/types/route'
import type { SearchHistoryItem } from '@/types/search'
import { getCurrentCoordinate } from '@/utils/location'
import { createIdempotencyKey } from '@/utils/share'

const SEARCH_DELAY_MS = 300

const toPoint = ({ id, name, address, coordinate }: PlaceSummary): RoutePoint => ({
  placeId: id,
  name,
  address,
  coordinate,
})

// 출발지(현재 위치) · 장소 검색 · 최근 검색 · 경로 미리보기
function useRouteSetting(destinationPlaceId?: string) {
  const [origin, setOrigin] = useState<RoutePoint | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSummary[] | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const initialDestination = useRef(destinationPlaceId)

  const loadHistory = () =>
    getSearchHistory()
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory([]))

  useEffect(() => {
    void loadHistory()

    getCurrentCoordinate()
      .then(async (coordinate) => {
        if (!coordinate) {
          setLocationStatus('unavailable')
          return
        }
        // 주소를 못 받아도 좌표만으로 경로는 계산할 수 있다
        const address = await reverseGeocode(coordinate)
          .then(({ data }) => data.address ?? '')
          .catch(() => '')
        setOrigin({ placeId: null, name: '내 위치', address, coordinate })
        setLocationStatus('ready')
      })
      .catch(() => setLocationStatus('unavailable'))
  }, [])

  // 입력하는 동안 결과를 바로 보여준다. 최근 검색 저장은 검색을 확정할 때만 한다
  const keyword = route || routeStatus === 'loading' ? '' : query.trim()
  useEffect(() => {
    if (!keyword) return
    let ignore = false
    const timer = setTimeout(() => {
      searchPlaces({ q: keyword, coordinate: origin?.coordinate })
        .then(({ data }) => !ignore && setResults(data.items))
        .catch(() => !ignore && setResults([]))
    }, SEARCH_DELAY_MS)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [keyword, origin])

  const saveQuery = (value: string) =>
    saveSearchHistory(value, createIdempotencyKey())
      .then(loadHistory)
      .catch(() => {})

  // 출발지가 없으면 화면에서 위치 권한 안내를 보여준다
  const routeTo = async (destination: RoutePoint) => {
    if (!origin) return
    setRouteStatus('loading')
    try {
      const { data } = await createRoute({ origin, destination }, createIdempotencyKey())
      setRoute(data)
      setRouteStatus('idle')
    } catch {
      setRouteStatus('error')
    }
  }

  // 장소 상세에서 시작했으면 그 장소로 바로 경로를 계산한다
  useEffect(() => {
    const placeId = initialDestination.current
    if (!placeId || !origin) return
    initialDestination.current = undefined

    fetchPlaceDetail(placeId)
      .then(({ data }) => {
        setQuery(data.place.name)
        return routeTo(toPoint(data.place))
      })
      .catch(() => setRouteStatus('error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 출발지가 정해졌을 때 한 번만
  }, [origin])

  const changeQuery = (value: string) => {
    setQuery(value)
    setRoute(null)
    setRouteStatus('idle')
    if (!value.trim()) setResults(null)
  }

  const submitSearch = (value: string) => void saveQuery(value)

  const selectRecent = (item: SearchHistoryItem) => {
    changeQuery(item.query)
    void saveQuery(item.query)
  }

  const deleteRecent = (historyId: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== historyId))
    deleteSearchHistory(historyId).catch(loadHistory)
  }

  const selectPlace = (place: PlaceSummary) => {
    if (query.trim()) void saveQuery(query.trim())
    setQuery(place.name)
    void routeTo(toPoint(place))
  }

  return {
    origin,
    locationStatus,
    history,
    query,
    results: query.trim() ? results : null,
    route,
    routeStatus,
    changeQuery,
    submitSearch,
    selectRecent,
    deleteRecent,
    selectPlace,
  }
}

export default useRouteSetting
