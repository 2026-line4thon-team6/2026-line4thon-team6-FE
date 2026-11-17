import playlistIcon from '@/assets/icons/playlist.svg'
import type { CardPlaylist } from '@/types/card'
import { formatPlaylistDuration } from '@/utils/cardFormat'
import styles from './PlaylistSummaryCard.module.scss'

interface PlaylistSummaryCardProps {
  playlist: CardPlaylist | null
  onClick?: () => void
  className?: string
}

function PlaylistSummaryCard({ playlist, onClick, className }: PlaylistSummaryCardProps) {
  const body = (
    <>
      {playlist?.thumbnailUrl ? (
        <img className={styles.cover} src={playlist.thumbnailUrl} alt="" />
      ) : (
        <span className={styles.cover} aria-hidden />
      )}
      <span className={styles.text}>
        <span className={styles.badge}>함께 들었던 플레이리스트</span>
        <span className={styles.title}>{playlist?.title ?? '- -'}</span>
        {playlist && (
          <span className={styles.meta}>
            총 {playlist.trackCount}곡 · {formatPlaylistDuration(playlist.durationSeconds)}
          </span>
        )}
      </span>
      <img className={styles.icon} src={playlistIcon} alt="" />
    </>
  )
  const classes = [styles.card, onClick && styles.button, className].filter(Boolean).join(' ')

  return onClick ? (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={`함께 들었던 플레이리스트 ${playlist?.title ?? ''} 보기`}
    >
      {body}
    </button>
  ) : (
    <section className={classes} aria-label="함께 들었던 플레이리스트">
      {body}
    </section>
  )
}

export default PlaylistSummaryCard
