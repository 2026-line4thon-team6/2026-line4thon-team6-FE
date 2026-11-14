import chevronIcon from '@/assets/icons/chevron-white.svg'
import { formatRemaining } from '@/utils/cardFormat'
import styles from './PendingCardBanner.module.scss'

interface PendingCardBannerProps {
  count: number // 저장하지 않은 카드 수
  remainingSeconds: number // 마감이 가장 빠른 카드의 남은 시간
  onClick: () => void
  className?: string
}

// 홈 상단의 미작성 드라이브 카드 배너 (Figma: 카드 미작성 배너, 348 x 55)
function PendingCardBanner({ count, remainingSeconds, onClick, className }: PendingCardBannerProps) {
  return (
    <button type="button" className={[styles.banner, className].filter(Boolean).join(' ')} onClick={onClick}>
      <span className={styles.text}>
        <span className={styles.title}>
          미작성 드라이브 카드 <strong>{count}개</strong>
        </span>
        <span className={styles.meta}>
          남은 시간 {formatRemaining(remainingSeconds)}
          <span className={styles.separator} aria-hidden>
            ㅣ
          </span>
          눌러서 완성하기
        </span>
      </span>
      <span className={styles.arrow} aria-hidden>
        <img src={chevronIcon} alt="" />
      </span>
    </button>
  )
}

export default PendingCardBanner
