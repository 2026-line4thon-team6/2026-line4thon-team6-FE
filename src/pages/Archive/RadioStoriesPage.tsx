import { RADIO_SEARCH_MAX_LENGTH } from '@/api/radio'
import chevronIcon from '@/assets/icons/chevron-light.svg'
import storyIcon from '@/assets/icons/radio-story.svg'
import searchIcon from '@/assets/icons/search.svg'
import type { RadioEpisode } from '@/types/radio'
import ArchiveLayout from './ArchiveLayout'
import styles from './RadioStoriesPage.module.scss'

interface RadioStoriesPageProps {
  status: 'loading' | 'ready' | 'error'
  episodes: RadioEpisode[]
  // 입력 중인 검색어
  query: string
  // 지금 목록을 검색한 검색어 (앞뒤 공백 제외). 결과 없음 안내에 쓴다
  keyword: string
  onBack: () => void
  onRetry: () => void
  onQueryChange: (query: string) => void
  onStoryClick: (episodeId: string) => void
}

// 마이 > 라디오 사연 보관함. 사연은 한 줄로 줄여 보여 준다
function RadioStoriesPage({
  status,
  episodes,
  query,
  keyword,
  onBack,
  onRetry,
  onQueryChange,
  onStoryClick,
}: RadioStoriesPageProps) {
  return (
    <ArchiveLayout
      title="라디오 사연 보관함"
      status={status}
      loadingMessage="사연을 불러오는 중이에요."
      errorMessage="사연을 불러오지 못했어요."
      emptyMessage={
        episodes.length > 0 ? null : keyword ? `'${keyword}'에 맞는 사연이 없어요.` : '아직 보낸 사연이 없어요.'
      }
      toolbar={
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
      }
      onBack={onBack}
      onRetry={onRetry}
    >
      <ul className={styles.list} aria-label="보낸 사연">
        {episodes.map(({ id, story, broadcastText }) => (
          <li key={id}>
            <button type="button" className={styles.row} onClick={() => onStoryClick(id)}>
              <img className={styles.storyIcon} src={storyIcon} alt="" />
              <span className={styles.story}>{story ?? broadcastText}</span>
              <img className={styles.chevron} src={chevronIcon} alt="" />
            </button>
          </li>
        ))}
      </ul>
    </ArchiveLayout>
  )
}

export default RadioStoriesPage
