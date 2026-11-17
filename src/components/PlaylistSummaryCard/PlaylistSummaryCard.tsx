import playlistIcon from '@/assets/icons/playlist.svg'
import type { CardPlaylist } from '@/types/card'
import { formatPlaylistDuration } from '@/utils/cardFormat'
import styles from './PlaylistSummaryCard.module.scss'

interface PlaylistSummaryCardProps {
  playlist: CardPlaylist | null
  className?: string
}

function PlaylistSummaryCard({ playlist, className }: PlaylistSummaryCardProps) {
  return (
    <section className={[styles.card, className].filter(Boolean).join(' ')} aria-label="함께 들었던 플레이리스트">
      {playlist?.thumbnailUrl ? (
        <img className={styles.cover} src={playlist.thumbnailUrl} alt="" />
      ) : (
        <span className={styles.cover} aria-hidden />
      )}
      <div className={styles.text}>
        <span className={styles.badge}>함께 들었던 플레이리스트</span>
        <p className={styles.title}>{playlist?.title ?? '- -'}</p>
        {playlist && (
          <p className={styles.meta}>
            총 {playlist.trackCount}곡 · {formatPlaylistDuration(playlist.durationSeconds)}
          </p>
        )}
      </div>
      <img className={styles.icon} src={playlistIcon} alt="" />
    </section>
  )
}

export default PlaylistSummaryCard
