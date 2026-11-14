import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import SearchBar from '@/components/SearchBar/SearchBar'
import SearchResultItem from '@/components/SearchResultItem/SearchResultItem'
import type { RestArea } from '@/types/restArea'
import { formatDistance } from '@/utils/driveStats'
import styles from './RestAreaSearchPage.module.scss'

interface RestAreaSearchPageProps {
  query: string
  // null이면 아직 검색 전
  results: RestArea[] | null
  onQueryChange: (value: string) => void
  onSelect: (restArea: RestArea) => void
  onClose: () => void
}

// 휴게소 검색 (Figma 342:8671). 도장 찍기 팝업의 검색창을 누르면 화면 위에 열린다
function RestAreaSearchPage({ query, results, onQueryChange, onSelect, onClose }: RestAreaSearchPageProps) {
  return (
    <div className={styles.page} role="dialog" aria-modal="true" aria-label="휴게소 검색">
      <header className={styles.header}>
        <SearchBar
          className={styles.search}
          value={query}
          onValueChange={onQueryChange}
          onSearch={onQueryChange}
          placeholder="휴게소 이름을 검색해주세요."
          aria-label="휴게소 이름"
          autoFocus
        />
        <GlassIconButton icon="close" aria-label="닫기" onClick={onClose} />
      </header>

      {results && results.length === 0 && <p className={styles.message}>검색 결과가 없어요.</p>}
      {results && results.length > 0 && (
        <ul className={styles.results} aria-label="휴게소 검색 결과">
          {results.map((area) => (
            <li key={area.id}>
              <SearchResultItem
                variant="restArea"
                name={area.name}
                keyword={query}
                distance={area.distanceMeters === null ? null : formatDistance(area.distanceMeters)}
                address={area.address ?? area.highwayName}
                onSelect={() => onSelect(area)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RestAreaSearchPage
