import { type FormEvent, useEffect, useRef, useState } from 'react'
import calendarIcon from '@/assets/icons/calendar.svg'
import searchIcon from '@/assets/icons/search-gray.svg'
import mascotImage from '@/assets/images/record-map-mascot.webp'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import BottomNavBar from '@/components/BottomNavBar/BottomNavBar'
import type { RecordMapMarker, RecordSummary } from '@/types/record'
import RecordListItem from './RecordListItem'
import RecordMapView from './RecordMapView'
import RecordPreview from './RecordPreview'
import styles from './RecordMapPage.module.scss'

export type RecordView = 'map' | 'list'
type LoadStatus = 'loading' | 'ready' | 'error'

interface RecordMapPageProps {
  view: RecordView
  // 조건과 관계없는 전체 기록 수. 모르는 동안은 null
  totalCount: number | null
  mapStatus: LoadStatus
  markers: RecordMapMarker[]
  listStatus: LoadStatus
  records: RecordSummary[]
  hasMoreRecords: boolean
  onSearch: (query: string) => void
  onCalendarClick: () => void
  onViewChange: (view: RecordView) => void
  onLoadMore: () => void
  // 미리보기 카드 · 목록의 기록을 누르면 기록 상세로, 공유 버튼을 누르면 공유로 이동한다
  onCardClick: (card: RecordSummary) => void
  onShare: (card: RecordSummary) => void
  onRetry: () => void
  onTabChange?: (tab: NavTab) => void
}

const VIEWS: { value: RecordView; label: string }[] = [
  { value: 'map', label: '지도형' },
  { value: 'list', label: '목록형' },
]

// 목록 끝에 닿으면 다음 페이지를 부른다. IntersectionObserver가 없는 환경에서는 아무것도 하지 않는다
function LoadMoreTrigger({ onLoadMore }: { onLoadMore: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onLoadMoreRef.current()
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <li ref={ref} className={styles.loadMore} aria-hidden="true" />
}

// 기록 지도 - 지도형 (Figma 284:14400) / 목록형 (284:14758)
function RecordMapPage({
  view,
  totalCount,
  mapStatus,
  markers,
  listStatus,
  records,
  hasMoreRecords,
  onSearch,
  onCalendarClick,
  onViewChange,
  onLoadMore,
  onCardClick,
  onShare,
  onRetry,
  onTabChange,
}: RecordMapPageProps) {
  const [query, setQuery] = useState('')
  // 사진 마커를 누르면 그 목적지의 최신 기록을 미리보기로 띄운다
  const [preview, setPreview] = useState<RecordSummary | null>(null)
  const status = view === 'map' ? mapStatus : listStatus

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSearch(query.trim())
  }

  return (
    <div className={[styles.page, view === 'list' && styles.listPage].filter(Boolean).join(' ')}>
      {view === 'map' && (
        <div className={styles.map}>
          <RecordMapView markers={markers} onMarkerClick={(marker) => setPreview(marker.latestCard)} />
        </div>
      )}

      <div className={styles.top}>
        <header className={styles.header}>
          <div className={styles.titles}>
            {totalCount !== null && <p className={styles.count}>총 {totalCount}번의 드라이브를 함께했어요</p>}
            <h1 className={styles.title}>우리 어디까지 가봤지?</h1>
          </div>
          <img className={styles.mascot} src={mascotImage} alt="" width={117} height={78} />
        </header>

        <form className={styles.search} role="search" onSubmit={handleSubmit}>
          <input
            className={styles.searchInput}
            type="search"
            aria-label="기록 검색"
            placeholder="장소나 드라이브 제목을 검색해보세요."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className={styles.searchButton} type="submit" aria-label="검색">
            <img src={searchIcon} alt="" width={17} height={17} />
          </button>
          <button className={styles.searchButton} type="button" aria-label="날짜로 검색" onClick={onCalendarClick}>
            <img src={calendarIcon} alt="" width={17} height={19} />
          </button>
        </form>
      </div>

      {view === 'list' && listStatus === 'ready' && (
        <div className={styles.list}>
          {records.length === 0 ? (
            <p className={styles.empty}>조건에 맞는 드라이브 기록이 없어요.</p>
          ) : (
            <ul className={styles.records} aria-label="드라이브 기록 목록">
              {records.map((record) => (
                <li key={record.cardId}>
                  <RecordListItem record={record} onClick={onCardClick} />
                </li>
              ))}
              {hasMoreRecords && <LoadMoreTrigger onLoadMore={onLoadMore} />}
            </ul>
          )}
        </div>
      )}

      {status === 'loading' && (
        <p className={styles.notice} role="status">
          기록을 불러오는 중이에요
        </p>
      )}
      {status === 'error' && (
        <div className={styles.notice} role="alert">
          기록을 불러오지 못했어요
          <button className={styles.retry} type="button" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      )}

      <div className={styles.viewToggle} role="group" aria-label="보기 방식">
        {VIEWS.map(({ value, label }) => {
          const selected = value === view
          return (
            <button
              key={value}
              type="button"
              className={[styles.viewButton, selected && styles.selected].filter(Boolean).join(' ')}
              aria-pressed={selected}
              onClick={() => !selected && onViewChange(value)}
            >
              {label}
            </button>
          )
        })}
      </div>

      {view === 'map' && preview && (
        <RecordPreview card={preview} onOpen={onCardClick} onShare={onShare} onClose={() => setPreview(null)} />
      )}

      <BottomNavBar active="map" onChange={onTabChange} />
    </div>
  )
}

export default RecordMapPage
