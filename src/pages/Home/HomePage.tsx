import { useState } from 'react'
import themeIcon from '@/assets/images/info/theme-palm.svg'
import trafficIcon from '@/assets/images/info/traffic-car.svg'
import weatherIcon from '@/assets/images/info/weather-sunny.svg'
import bannerDawn from '@/assets/images/home-banner/dawn.webp'
import bannerDay from '@/assets/images/home-banner/day.webp'
import bannerEvening from '@/assets/images/home-banner/evening.webp'
import bannerNight from '@/assets/images/home-banner/night.webp'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import BottomNavBar from '@/components/BottomNavBar/BottomNavBar'
import Button from '@/components/Button/Button'
import CategoryChip from '@/components/CategoryChip/CategoryChip'
import NotificationButton from '@/components/NotificationButton/NotificationButton'
import PendingCardBanner from '@/components/PendingCardBanner/PendingCardBanner'
import SpotCard from '@/components/SpotCard/SpotCard'
import useDragScroll from '@/hooks/useDragScroll'
import type { PendingSummary } from '@/hooks/usePendingCards'
import type { HomeSummary } from '@/types/home'
import type { Category, SpotSummary } from '@/types/spot'
import type { TimeOfDay } from '@/utils/timeOfDay'
import styles from './HomePage.module.scss'

// 값을 불러오지 못했을 때의 표시 (기능명세서: '--')
const EMPTY = '--'
// 한 카테고리에서 보여주는 장소 카드 수 (기능명세서: 7개)
const MAX_SPOTS = 7
// 드라이브 준비 배너의 시간대별 배경 사진 (Figma '시간대별 배너 이미지' 609:10169)
const BANNER_IMAGES: Record<TimeOfDay, string> = {
  dawn: bannerDawn,
  day: bannerDay,
  evening: bannerEvening,
  night: bannerNight,
}

interface HomePageProps {
  home: HomeSummary
  categories: Category[]
  spots: SpotSummary[]
  // 차량(블루투스) 연결 여부. 서버가 아니라 기기 상태로 판단한다
  carConnected: boolean
  // 지금 시간대. 드라이브 준비 배너의 배경 사진이 바뀐다
  timeOfDay: TimeOfDay
  // 24시간 안에 저장하지 않은 드라이브 카드 (GET /cards/pending). 없으면 null
  pendingCard?: PendingSummary | null
  onNotificationClick?: () => void
  onStartDrive?: () => void
  onSpotClick?: (id: number) => void
  onLikeToggle?: (id: number, liked: boolean) => void
  onTabChange?: (tab: NavTab) => void
  onPendingCardClick?: (driveId: string) => void
}

function HomePage({
  home,
  categories,
  spots,
  carConnected,
  timeOfDay,
  pendingCard = null,
  onNotificationClick,
  onStartDrive,
  onSpotClick,
  onLikeToggle,
  onTabChange,
  onPendingCardClick,
}: HomePageProps) {
  const categoryDrag = useDragScroll<HTMLUListElement>()
  const spotDrag = useDragScroll<HTMLUListElement>()
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id)
  const { nickname, mascotName, daysTogether, unreadNotificationCount, context } = home
  const visibleSpots = spots.filter((spot) => spot.categoryId === selectedCategoryId).slice(0, MAX_SPOTS)

  const temperature = context.temperature === null ? EMPTY : `${context.temperature}°`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <span className={styles.mascot}>{mascotName}</span>
          <span className={styles.dday}>D+{daysTogether}</span>
        </p>
        <NotificationButton hasUnread={unreadNotificationCount > 0} onClick={onNotificationClick} />
      </header>

      <main>
        <h1 className={styles.greeting}>
          <span className={styles.hello}>안녕하세요, {nickname}님! 👋🏻</span>
          <span className={styles.question}>오늘은 어디로 떠나볼까요?</span>
        </h1>

        {pendingCard && (
          <PendingCardBanner
            className={styles.pendingBanner}
            count={pendingCard.count}
            remainingSeconds={pendingCard.remainingSeconds}
            onClick={() => onPendingCardClick?.(pendingCard.driveId)}
          />
        )}

        <section className={styles.banner} aria-label="드라이브 준비">
          <img className={styles.bannerImage} src={BANNER_IMAGES[timeOfDay]} alt="" />

          <ul className={styles.infoList}>
            <li className={styles.info}>
              <img src={weatherIcon} alt="" />
              <span className={styles.infoText}>
                <span className={styles.infoLabel}>{context.weather ?? '날씨'}</span>
                <span className={styles.infoValue}>{temperature}</span>
              </span>
            </li>
            <li className={[styles.info, styles.infoStrong, styles.traffic].join(' ')}>
              <img src={trafficIcon} alt="" />
              <span className={styles.infoText}>
                <span className={styles.infoLabel}>교통 상황</span>
                <span className={[styles.infoValue, context.traffic === '원활' && styles.smooth].filter(Boolean).join(' ')}>
                  {context.traffic ?? EMPTY}
                </span>
              </span>
            </li>
            <li className={[styles.info, styles.infoStrong, styles.theme].join(' ')}>
              <img src={themeIcon} alt="" />
              <span className={styles.infoText}>
                <span className={styles.infoLabel}>추천 테마</span>
                <span className={styles.infoValue}>{context.recommendedTheme ?? EMPTY}</span>
              </span>
            </li>
          </ul>

          <p className={[styles.carStatus, !carConnected && styles.disconnected].filter(Boolean).join(' ')}>
            {carConnected ? '차량 연결 완료' : '차량 연결 실패'}
          </p>
          <Button className={styles.startButton} size="lg" icon="car" onClick={onStartDrive}>
            드라이브 시작하기
          </Button>
        </section>

        <hr className={styles.divider} />

        <section className={styles.curation} aria-labelledby="curation-title">
          <h2 id="curation-title" className={styles.sectionTitle}>
            스마트 탐색 &amp; 큐레이션
          </h2>
          <p className={styles.sectionDescription}>지금 기분에 맞는 드라이브를 찾아보세요.</p>

          <ul className={[styles.scroller, styles.categories].join(' ')} {...categoryDrag}>
            {categories.map(({ id, name, iconUrl }) => (
              <li key={id}>
                <CategoryChip
                  icon={iconUrl}
                  label={name}
                  selected={id === selectedCategoryId}
                  onClick={() => setSelectedCategoryId(id)}
                />
              </li>
            ))}
          </ul>

          {visibleSpots.length > 0 ? (
            // key: 카테고리를 바꾸면 목록을 새로 그려 스크롤 위치를 처음으로 되돌린다
            <ul key={selectedCategoryId} className={[styles.scroller, styles.spots].join(' ')} {...spotDrag}>
              {visibleSpots.map((spot) => (
                <li key={spot.id}>
                  <SpotCard spot={spot} onClick={onSpotClick} onLikeToggle={onLikeToggle} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>추천 장소를 준비하고 있어요.</p>
          )}
        </section>
      </main>

      <BottomNavBar active="home" onChange={onTabChange} />
    </div>
  )
}

export default HomePage
