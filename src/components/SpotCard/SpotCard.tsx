import pinIcon from '@/assets/icons/pin.svg'
import LikeButton from '@/components/LikeButton/LikeButton'
import type { SpotSummary } from '@/types/spot'
import styles from './SpotCard.module.scss'

interface SpotCardProps {
  spot: SpotSummary
  onClick?: (id: number) => void
  onLikeToggle?: (id: number, liked: boolean) => void
}

// 홈 큐레이션 스팟 카드. 데이터는 백엔드 응답(SpotSummary)으로 채운다
function SpotCard({ spot, onClick, onLikeToggle }: SpotCardProps) {
  const { id, name, region, travelTime, imageUrl, tags, liked } = spot

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
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
            {region} · {travelTime}
          </p>
        </div>

        <ul className={styles.tags}>
          {tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              #{tag}
            </li>
          ))}
        </ul>
      </div>

      <LikeButton
        className={styles.like}
        liked={liked}
        onToggle={(next) => onLikeToggle?.(id, next)}
      />
    </article>
  )
}

export default SpotCard
