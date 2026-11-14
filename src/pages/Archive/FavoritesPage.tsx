import CategoryChip from '@/components/CategoryChip/CategoryChip'
import useDragScroll from '@/hooks/useDragScroll'
import type { PlaceCategory, PlaceSummary } from '@/types/place'
import ArchiveLayout from './ArchiveLayout'
import FavoriteCourseCard from './FavoriteCourseCard'
import styles from './FavoritesPage.module.scss'
import { PLACE_CATEGORIES } from './placeCategories'

interface FavoritesPageProps {
  status: 'loading' | 'ready' | 'error'
  places: PlaceSummary[]
  // 고른 카테고리 칩
  category: PlaceCategory
  onBack: () => void
  onRetry: () => void
  onSelectCategory: (category: PlaceCategory) => void
  onFavoriteToggle: (placeId: string, favorite: boolean) => void
  onPlaceClick: (placeId: string) => void
}

// 마이 > 찜한 드라이브 코스 보관함
function FavoritesPage({
  status,
  places,
  category,
  onBack,
  onRetry,
  onSelectCategory,
  onFavoriteToggle,
  onPlaceClick,
}: FavoritesPageProps) {
  const categoryDrag = useDragScroll<HTMLUListElement>()
  const categoryLabel = PLACE_CATEGORIES.find(({ value }) => value === category)?.label

  return (
    <ArchiveLayout
      title="찜한 드라이브 코스"
      status={status}
      loadingMessage="찜한 코스를 불러오는 중이에요."
      errorMessage="찜한 코스를 불러오지 못했어요."
      emptyMessage={places.length > 0 ? null : `${categoryLabel} 카테고리에 찜한 코스가 없어요.`}
      toolbar={
        <ul className={styles.categories} aria-label="카테고리" {...categoryDrag}>
          {PLACE_CATEGORIES.map(({ value, label, icon }) => (
            <li key={value}>
              <CategoryChip
                icon={icon}
                label={label}
                selected={value === category}
                onClick={() => onSelectCategory(value)}
              />
            </li>
          ))}
        </ul>
      }
      onBack={onBack}
      onRetry={onRetry}
    >
      <ul className={styles.list}>
        {places.map((place) => (
          <li key={place.id}>
            <FavoriteCourseCard place={place} onClick={onPlaceClick} onFavoriteToggle={onFavoriteToggle} />
          </li>
        ))}
      </ul>
    </ArchiveLayout>
  )
}

export default FavoritesPage
