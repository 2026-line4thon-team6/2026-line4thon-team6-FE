import BottomCTAButton from '@/components/BottomCTAButton/BottomCTAButton'
import DriveStats from '@/components/DriveStats/DriveStats'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RecentSearchItem from '@/components/RecentSearchItem/RecentSearchItem'
import RouteSearchBox from '@/components/RouteSearchBox/RouteSearchBox'
import SearchResultItem from '@/components/SearchResultItem/SearchResultItem'
import type { PlaceSummary } from '@/types/place'
import type { Route } from '@/types/route'
import type { SearchHistoryItem } from '@/types/search'
import { formatArrival, formatDistance, formatElapsed } from '@/utils/driveStats'
import styles from './RouteSettingPage.module.scss'

interface RouteSettingPageProps {
  originAddress: string | null
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

// 경로 설정 (Figma 검색 289:20769 · 289:20830 · 289:20892, 경로 설정하기 289:21024)
function RouteSettingPage({
  originAddress,
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

      {routeStatus === 'error' && (
        <p role="alert" className={styles.message}>
          경로를 찾지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      {route ? (
        <>
          {/* TODO: 카카오맵에 route.polyline 그리기 */}
          <div className={styles.map} aria-hidden="true" />
          <div className={styles.bottom}>
            <DriveStats
              className={styles.stats}
              items={[
                { label: '예상 주행 시간', value: formatElapsed(route.durationSeconds) },
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
