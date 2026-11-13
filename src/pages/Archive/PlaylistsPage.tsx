import playlistIcon from '@/assets/icons/playlist.svg'
import type { SavedPlaylist } from '@/types/playlist'
import ArchiveLayout from './ArchiveLayout'
import styles from './PlaylistsPage.module.scss'

interface PlaylistsPageProps {
  status: 'loading' | 'ready' | 'error'
  playlists: SavedPlaylist[]
  totalCount: number
  onBack: () => void
  onRetry: () => void
  onPlaylistClick: (playlistId: string) => void
}

// 시안의 '약 00분' 표기. 시간 단위로 바꾸지 않고 분으로만 보여 준다
const formatMinutes = (seconds: number) => `약 ${Math.max(1, Math.round(seconds / 60))}분`

// 마이 > 플레이리스트 보관함
function PlaylistsPage({ status, playlists, totalCount, onBack, onRetry, onPlaylistClick }: PlaylistsPageProps) {
  return (
    <ArchiveLayout
      title="플레이리스트 보관함"
      status={status}
      loadingMessage="플레이리스트를 불러오는 중이에요."
      errorMessage="플레이리스트를 불러오지 못했어요."
      emptyMessage={playlists.length > 0 ? null : '아직 저장한 플레이리스트가 없어요.'}
      onBack={onBack}
      onRetry={onRetry}
    >
      <div className={styles.content}>
        <h2 className={styles.count}>
          내가 저장한 플레이리스트 <span className={styles.number}>{totalCount}개</span>
        </h2>

        <ul className={styles.list}>
          {playlists.map(({ id, title, trackCount, durationSeconds, thumbnailUrl, driveTitle }) => (
            <li key={id}>
              <button type="button" className={styles.card} onClick={() => onPlaylistClick(id)}>
                <span className={styles.cover}>{thumbnailUrl && <img src={thumbnailUrl} alt="" loading="lazy" />}</span>
                <span className={styles.text}>
                  {driveTitle && <span className={styles.badge}>{driveTitle}</span>}
                  <span className={styles.title}>{title}</span>
                  <span className={styles.meta}>
                    총 {trackCount}곡 · {formatMinutes(durationSeconds)}
                  </span>
                </span>
                <img className={styles.icon} src={playlistIcon} alt="" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ArchiveLayout>
  )
}

export default PlaylistsPage
