import chevronIcon from '@/assets/icons/chevron-white.svg'
import balanceImage from '@/assets/images/contents/balance.webp'
import memoryImage from '@/assets/images/contents/memory.webp'
import nonsenseImage from '@/assets/images/contents/nonsense.webp'
import radioImage from '@/assets/images/contents/radio.webp'
import PlaylistSummaryCard from '@/components/PlaylistSummaryCard/PlaylistSummaryCard'
import RadioWave from '@/components/RadioWave/RadioWave'
import type { CardPlaylist } from '@/types/card'
import styles from './ContentCards.module.scss'

export type ContentKind = 'radio' | 'balance' | 'nonsense' | 'memory'

const GAMES: { kind: ContentKind; title: string; description: string; image: string; box: [number, number, number, number] }[] = [
  { kind: 'radio', title: '라디오', description: '드라이브에 감성을 담는', image: radioImage, box: [106, 4, 44, 37] },
  { kind: 'balance', title: '밸런스 게임', description: '둘 중 하나만 고른다면?', image: balanceImage, box: [107, 10, 46, 28] },
  { kind: 'nonsense', title: '넌센스 퀴즈', description: '누가 더 많이 맞힐까?', image: nonsenseImage, box: [105, 6, 46, 35] },
  { kind: 'memory', title: '추억 게임', description: '함께한 추억 돌아보기', image: memoryImage, box: [104, 7, 46, 40] },
]

interface ContentCardsProps {
  onPlaylistClick?: () => void
  onPlaylistOpen?: (playlistId: string) => void
  onContentClick?: (kind: ContentKind) => void
  radioPlaying?: boolean
  playlist?: CardPlaylist | null
  locked?: boolean
}

function ContentCards({
  onPlaylistClick,
  onPlaylistOpen,
  onContentClick,
  radioPlaying = false,
  playlist = null,
  locked = false,
}: ContentCardsProps) {
  return (
    <div className={styles.cards}>
      {playlist ? (
        <PlaylistSummaryCard playlist={playlist} onClick={locked ? undefined : () => onPlaylistOpen?.(playlist.id)} />
      ) : (
        <button type="button" className={styles.playlist} onClick={onPlaylistClick} disabled={locked}>
          <span className={styles.playlistLabel}>DJ 플레이리스트</span>
          <span className={styles.playlistRow}>
            <span className={styles.playlistText}>
              둘의 취향에 맞는
              <br />
              플레이리스트를 만들러 가볼까요?
            </span>
            <span className={styles.arrow} aria-hidden>
              <img src={chevronIcon} alt="" />
            </span>
          </span>
        </button>
      )}

      <ul className={styles.games}>
        {GAMES.map(({ kind, title, description, image, box: [left, top, width, height] }) => (
          <li key={kind}>
            <button type="button" className={styles.game} onClick={() => onContentClick?.(kind)} disabled={locked}>
              <span className={styles.gameTitle}>{title}</span>
              {kind === 'radio' && radioPlaying ? (
                <span className={styles.playing}>
                  재생 중
                  <RadioWave />
                </span>
              ) : (
                <span className={styles.gameDescription}>{description}</span>
              )}
              <img className={styles.gameImage} src={image} alt="" style={{ left, top, width, height }} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ContentCards
