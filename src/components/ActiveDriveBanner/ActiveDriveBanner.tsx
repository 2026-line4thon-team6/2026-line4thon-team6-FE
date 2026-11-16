import chevronIcon from '@/assets/icons/chevron-white.svg'
import styles from '@/components/PendingCardBanner/PendingCardBanner.module.scss'

interface ActiveDriveBannerProps {
  onClick: () => void
  // 출발 전, 준비만 하고 나간 드라이브 (경로 설정 중 이탈 등)
  preparing?: boolean
  className?: string
}

function ActiveDriveBanner({ onClick, preparing = false, className }: ActiveDriveBannerProps) {
  return (
    <button type="button" className={[styles.banner, className].filter(Boolean).join(' ')} onClick={onClick}>
      <span className={styles.text}>
        <span className={styles.title}>
          {preparing ? '준비 중인 드라이브가 있어요! 🚘' : '현재 기록 중인 드라이브가 있어요! 🚘'}
        </span>
        <span className={styles.meta}>
          {preparing ? '눌러서 이어서 준비하기' : '눌러서 드라이브 화면으로 이동하기'}
        </span>
      </span>
      <span className={styles.arrow} aria-hidden>
        <img src={chevronIcon} alt="" />
      </span>
    </button>
  )
}

export default ActiveDriveBanner
