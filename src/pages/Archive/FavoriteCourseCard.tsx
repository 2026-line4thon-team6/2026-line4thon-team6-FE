import pinIcon from '@/assets/icons/pin.svg'
import LikeButton from '@/components/LikeButton/LikeButton'
import type { PlaceSummary } from '@/types/place'
import { formatDuration } from '@/utils/formatDuration'
import styles from './FavoriteCourseCard.module.scss'

interface FavoriteCourseCardProps {
  place: PlaceSummary
  onClick: (placeId: string) => void
  onFavoriteToggle: (placeId: string, favorite: boolean) => void
}

// 찜한 드라이브 코스 카드 (Figma 340 x 189). 홈 스팟 카드를 가로로 넓힌 모양이다
function FavoriteCourseCard({ place, onClick, onFavoriteToggle }: FavoriteCourseCardProps) {
  const { id, name, region, thumbnailUrl, hashtags, estimatedDurationSeconds, isFavorite } = place
  const titleId = `favorite-course-${id}`

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={styles.thumbnail}>{thumbnailUrl && <img src={thumbnailUrl} alt="" loading="lazy" />}</div>

      <div className={styles.body}>
        <div>
          <h2 id={titleId} className={styles.name}>
            {/* 카드 전체를 클릭 영역으로 만들기 위한 버튼 (::after로 확장) */}
            <button type="button" className={styles.link} onClick={() => onClick(id)}>
              {name}
            </button>
          </h2>
          <p className={styles.meta}>
            <img src={pinIcon} alt="" />
            {region} · {formatDuration(estimatedDurationSeconds)}
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
        size="lg"
        liked={isFavorite}
        onToggle={(favorite) => onFavoriteToggle(id, favorite)}
      />
    </article>
  )
}

export default FavoriteCourseCard
