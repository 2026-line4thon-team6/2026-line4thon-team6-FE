import { type FormEvent, useState } from 'react'
import calendarIcon from '@/assets/icons/calendar.svg'
import searchIcon from '@/assets/icons/search.svg'
import mascotImage from '@/assets/images/record-map-mascot.webp'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import BottomNavBar from '@/components/BottomNavBar/BottomNavBar'
import type { RecordMapCard, RecordMapMarker } from '@/types/record'
import RecordMapView from './RecordMapView'
import RecordPreview from './RecordPreview'
import styles from './RecordMapPage.module.scss'

export type RecordView = 'map' | 'list'

interface RecordMapPageProps {
  status: 'loading' | 'ready' | 'error'
  markers: RecordMapMarker[]
  totalCount: number
  onSearch: (query: string) => void
  onCalendarClick: () => void
  onViewChange: (view: RecordView) => void
  // 미리보기 카드를 누르면 기록 상세로, 공유 버튼을 누르면 공유로 이동한다
  onCardClick: (card: RecordMapCard) => void
  onShare: (card: RecordMapCard) => void
  onRetry: () => void
  onTabChange?: (tab: NavTab) => void
}

const VIEWS: { value: RecordView; label: string }[] = [
  { value: 'map', label: '지도형' },
  { value: 'list', label: '목록형' },
]

// 기록 지도 - 지도형 (Figma 284:14400)
function RecordMapPage({
  status,
  markers,
  totalCount,
  onSearch,
  onCalendarClick,
  onViewChange,
  onCardClick,
  onShare,
  onRetry,
  onTabChange,
}: RecordMapPageProps) {
  const [query, setQuery] = useState('')
  // 사진 마커를 누르면 그 목적지의 최신 기록을 미리보기로 띄운다
  const [preview, setPreview] = useState<RecordMapCard | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSearch(query.trim())
  }

  return (
    <div className={styles.page}>
      <div className={styles.map}>
        <RecordMapView markers={markers} onMarkerClick={(marker) => setPreview(marker.latestCard)} />
      </div>

      <div className={styles.top}>
        <header className={styles.header}>
          <div className={styles.titles}>
            {status === 'ready' && <p className={styles.count}>총 {totalCount}번의 드라이브를 함께했어요</p>}
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
          const selected = value === 'map'
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

      {preview && (
        <RecordPreview card={preview} onOpen={onCardClick} onShare={onShare} onClose={() => setPreview(null)} />
      )}

      <BottomNavBar active="map" onChange={onTabChange} />
    </div>
  )
}

export default RecordMapPage
