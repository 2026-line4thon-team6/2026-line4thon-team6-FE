import chevronIcon from '@/assets/icons/chevron-white.svg'
import styles from '@/components/PendingCardBanner/PendingCardBanner.module.scss'

interface ActiveDriveBannerProps {
  onClick: () => void
  className?: string
}

// 홈 상단 드라이브 진행중 배너
function ActiveDriveBanner({ onClick, className }: ActiveDriveBannerProps) {
  return (
    <button type="button" className={[styles.banner, className].filter(Boolean).join(' ')} onClick={onClick}>
      <span className={styles.text}>
        <span className={styles.title}>현재 기록 중인 드라이브가 있어요! 🚘</span>
        <span className={styles.meta}>눌러서 드라이브 화면으로 이동하기</span>
      </span>
      <span className={styles.arrow} aria-hidden>
        <img src={chevronIcon} alt="" />
      </span>
    </button>
  )
}

export default ActiveDriveBanner
