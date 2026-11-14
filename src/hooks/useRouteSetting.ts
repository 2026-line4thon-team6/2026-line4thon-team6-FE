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

function useRouteSetting(destinationPlaceId?: string, initialQuery = '') {
  const [origin, setOrigin] = useState<RoutePoint | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [query, setQuery] = useState(initialQuery)
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
        const address = await reverseGeocode(coordinate)
          .then(({ data }) => data.address ?? '')
          .catch(() => '')
        setOrigin({ placeId: null, name: '내 위치', address, coordinate })
        setLocationStatus('ready')
      })
      .catch(() => setLocationStatus('unavailable'))
  }, [])

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
