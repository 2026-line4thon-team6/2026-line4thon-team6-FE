import pinIcon from '@/assets/icons/pin.svg'
import LikeButton from '@/components/LikeButton/LikeButton'
import type { PlaceSummary } from '@/types/place'
import { formatRegionDuration } from '@/utils/formatDuration'
import styles from './SpotCard.module.scss'

interface SpotCardProps {
  spot: PlaceSummary
  onClick?: (id: string) => void
  onLikeToggle?: (id: string, liked: boolean) => void
}

// 홈 큐레이션 스팟 카드. 데이터는 추천 장소 응답(PlaceSummary)으로 채운다
function SpotCard({ spot, onClick, onLikeToggle }: SpotCardProps) {
  const { id, name, region, estimatedDurationSeconds, thumbnailUrl, hashtags, isFavorite } = spot

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {thumbnailUrl && <img src={thumbnailUrl} alt="" loading="lazy" />}
      </div>

      <div className={styles.body}>
        <div>
          <h3 className={styles.name}>
            {/* 카드 전체를 클릭 영역으로 만들기 위한 버튼 (::after로 확장) */}
            <button type="button" className={styles.link} onClick={() => onClick?.(id)}>
              {name}
            </button>
          </h3>
          <p className={styles.meta}>
            <img src={pinIcon} alt="" />
            {/* 소요 시간은 서버가 아직 주지 않아(null) 지역만 보여 준다 */}
            {formatRegionDuration(region, estimatedDurationSeconds)}
          </p>
        </div>

        <ul className={styles.tags}>
          {hashtags.map((tag) => (
            <li key={tag} className={styles.tag}>
              #{tag}
            </li>
          ))}
        </ul>
      </div>

      <LikeButton
        className={styles.like}
        liked={isFavorite}
        onToggle={(next) => onLikeToggle?.(id, next)}
      />
    </article>
  )
}

export default SpotCard
