import { useMemo } from 'react'
import BottomCTAButton from '@/components/BottomCTAButton/BottomCTAButton'
import DriveMap from '@/components/DriveMap/DriveMap'
import DriveStats from '@/components/DriveStats/DriveStats'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RecentSearchItem from '@/components/RecentSearchItem/RecentSearchItem'
import RouteSearchBox from '@/components/RouteSearchBox/RouteSearchBox'
import SearchResultItem from '@/components/SearchResultItem/SearchResultItem'
import type { PlaceSummary } from '@/types/place'
import type { Route } from '@/types/route'
import type { SearchHistoryItem } from '@/types/search'
import { formatArrival, formatDistance, formatEstimatedDuration } from '@/utils/driveStats'
import { decodePolyline } from '@/utils/polyline'
import styles from './RouteSettingPage.module.scss'

interface RouteSettingPageProps {
  originAddress: string | null
  locationUnavailable?: boolean
  query: string
  history: SearchHistoryItem[]
  // null이면 최근 검색을 보여준다
  results: PlaceSummary[] | null
  route: Route | null
  routeStatus: 'idle' | 'loading' | 'error'
  confirming?: boolean
  onQueryChange: (value: string) => void
  onSearch: (keyword: string) => void
  onRecentSelect: (item: SearchHistoryItem) => void
  onRecentDelete: (historyId: string) => void
  onResultSelect: (place: PlaceSummary) => void
  onConfirm: () => void
  onClose: () => void
}

// '서울 서초구 서초동' → '서초구 서초동'
const shortAddress = (address: string) => address.split(' ').slice(1).join(' ') || address

const formatDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`
}

// 경로 전체를 맞출 때 위 검색창 · 아래 주행 정보와 버튼에 가리지 않게 띄운다
const FIT_PADDING: [number, number, number, number] = [150, 40, 230, 40]

// 경로 설정 (Figma 검색 289:20769 · 289:20830 · 289:20892, 경로 설정하기 289:21024)
function RouteSettingPage({
  originAddress,
  locationUnavailable = false,
  query,
  history,
  results,
  route,
  routeStatus,
  confirming = false,
  onQueryChange,
  onSearch,
  onRecentSelect,
  onRecentDelete,
  onResultSelect,
  onConfirm,
  onClose,
}: RouteSettingPageProps) {
  const path = useMemo(() => (route ? decodePolyline(route.polyline) : []), [route])

  return (
    <div className={[styles.page, route && styles.preview].filter(Boolean).join(' ')}>
      <h1 className={styles.srOnly}>경로 설정</h1>
      <header className={styles.header}>
        <RouteSearchBox
          className={styles.searchBox}
          originLabel="내 위치"
          originDetail={originAddress ? shortAddress(originAddress) : undefined}
          destination={query}
          onDestinationChange={onQueryChange}
          onSearch={onSearch}
          // TODO: 경유지 추가
          onAddWaypoint={() => {}}
          autoFocus={!route}
        />
        <GlassIconButton icon="close" aria-label="닫기" onClick={onClose} />
      </header>

      {locationUnavailable && (
        <p role="alert" className={styles.message}>
          현재 위치를 확인할 수 없어요. 위치 권한을 허용해 주세요.
        </p>
      )}
      {routeStatus === 'error' && (
        <p role="alert" className={styles.message}>
          경로를 찾지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      {routeStatus === 'loading' ? (
        <p role="status" className={styles.message}>
          경로를 찾는 중이에요.
        </p>
      ) : route ? (
        <>
          <div className={styles.map}>
            <DriveMap
              current={route.origin.coordinate}
              path={path}
              destination={route.destination.coordinate}
              fitPadding={FIT_PADDING}
            />
          </div>
          <div className={styles.bottom}>
            <DriveStats
              className={styles.stats}
              items={[
                { label: '예상 주행 시간', value: formatEstimatedDuration(route.durationSeconds) },
                { label: '이동 거리', value: formatDistance(route.distanceMeters) },
                { label: '예상 도착 시간', value: formatArrival(route.estimatedArrivalAt) },
              ]}
            />
            <BottomCTAButton onClick={onConfirm} disabled={confirming}>
              경로 설정하기
            </BottomCTAButton>
          </div>
        </>
      ) : results ? (
        results.length > 0 ? (
          <ul className={styles.results} aria-label="검색 결과">
            {results.map((place) => (
              <li key={place.id}>
                <SearchResultItem
                  name={place.name}
                  keyword={query}
                  distance={place.distanceMeters === null ? null : formatDistance(place.distanceMeters)}
                  address={place.address}
                  onSelect={() => onResultSelect(place)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.message}>검색 결과가 없어요.</p>
        )
      ) : (
        <ul className={styles.recent} aria-label="최근 검색">
          {history.map((item) => (
            <li key={item.id}>
              <RecentSearchItem
                keyword={item.query}
                date={formatDate(item.searchedAt)}
                onSelect={() => onRecentSelect(item)}
                onDelete={() => onRecentDelete(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RouteSettingPage
