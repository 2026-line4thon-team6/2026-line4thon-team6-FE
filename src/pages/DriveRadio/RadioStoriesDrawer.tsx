import { RADIO_SEARCH_MAX_LENGTH } from '@/api/radio'
import chevronIcon from '@/assets/icons/chevron-light.svg'
import storyIcon from '@/assets/icons/radio-story.svg'
import searchIcon from '@/assets/icons/search-coral.svg'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import useOverlay from '@/hooks/useOverlay'
import type { RadioEpisode } from '@/types/radio'
import styles from './RadioStoriesDrawer.module.scss'

interface RadioStoriesDrawerProps {
  status: 'loading' | 'ready' | 'error'
  episodes: RadioEpisode[]
  query: string
  keyword: string
  // 다음 페이지 더 보기 (보관함 · 알림 목록과 같은 방식)
  hasMore: boolean
  loadingMore: boolean
  onQueryChange: (query: string) => void
  onRetry: () => void
  onSelect: (episode: RadioEpisode) => void
  onLoadMore: () => void
  onClose: () => void
}

function RadioStoriesDrawer({
  status,
  episodes,
  query,
  keyword,
  hasMore,
  loadingMore,
  onQueryChange,
  onRetry,
  onSelect,
  onLoadMore,
  onClose,
}: RadioStoriesDrawerProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={ref}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="radio-stories-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.top}>
          <div className={styles.titleRow}>
            <h2 id="radio-stories-title" className={styles.title}>
              보낸 사연 목록
            </h2>
            <GlassIconButton icon="close" aria-label="닫기" onClick={onClose} />
          </div>
          <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
            <input
              className={styles.input}
              type="search"
              aria-label="사연 검색"
              placeholder="지난 사연을 검색해보세요."
              value={query}
              maxLength={RADIO_SEARCH_MAX_LENGTH}
              enterKeyHint="search"
              onChange={(event) => onQueryChange(event.target.value)}
            />
            <img className={styles.searchIcon} src={searchIcon} alt="" />
          </form>
        </div>

        {status === 'loading' && (
          <p className={styles.message} role="status">
            사연을 불러오는 중이에요.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.message} role="alert">
            <p>사연을 불러오지 못했어요.</p>
            <button type="button" className={styles.retry} onClick={onRetry}>
              다시 시도
            </button>
          </div>
        )}
        {status === 'ready' && episodes.length === 0 && (
          <p className={styles.message}>
            {keyword ? `'${keyword}'에 맞는 사연이 없어요.` : '아직 보낸 사연이 없어요.'}
          </p>
        )}
        {status === 'ready' && episodes.length > 0 && (
          <ul className={styles.list} aria-label="보낸 사연">
            {episodes.map((episode) => (
              <li key={episode.id}>
                <button type="button" className={styles.row} onClick={() => onSelect(episode)}>
                  <img className={styles.storyIcon} src={storyIcon} alt="" />
                  <span className={styles.story}>{episode.story ?? episode.broadcastText}</span>
                  <img className={styles.chevron} src={chevronIcon} alt="" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {status === 'ready' && episodes.length > 0 && hasMore && (
          <button type="button" className={styles.loadMore} disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? '불러오는 중…' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  )
}

export default RadioStoriesDrawer
