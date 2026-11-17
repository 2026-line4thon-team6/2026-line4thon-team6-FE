import chevronIcon from '@/assets/icons/record-chevron.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import type { PendingCardItem } from '@/hooks/usePendingCards'
import { formatRemaining } from '@/utils/cardFormat'
import styles from './PendingCardSheet.module.scss'

interface PendingCardSheetProps {
  cards: PendingCardItem[] // 마감순
  onSelect: (driveId: string) => void
  onClose: () => void
}

// 1시간도 안 남은 카드는 남은 시간을 코랄로 강조한다
const URGENT_SECONDS = 60 * 60

// 마친 날은 한국 시간 기준 (예: '11월 16일')
const endedDate = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })

// 미작성 카드가 2개 이상일 때 배너를 누르면 뜨는 목록. 골라서 그 카드를 쓰러 간다
function PendingCardSheet({ cards, onSelect, onClose }: PendingCardSheetProps) {
  return (
    <BottomSheet aria-label="작성하지 않은 드라이브 카드" onClose={onClose}>
      <h2 className={styles.title}>작성하지 않은 카드 {cards.length}개</h2>
      <p className={styles.description}>마친 지 24시간이 지나면 카드가 사라져요.</p>
      <ul className={styles.list}>
        {cards.map((card) => (
          <li key={card.cardId}>
            <button type="button" className={styles.row} onClick={() => onSelect(card.driveId)}>
              <span className={styles.text}>
                <span className={styles.name}>
                  <span className={styles.nameText}>{card.title}</span>
                  {card.writing && <span className={styles.badge}>작성 중</span>}
                </span>
                <span className={styles.meta}>
                  {endedDate.format(new Date(card.endedAt))}
                  <span className={styles.separator} aria-hidden>
                    ㅣ
                  </span>
                  <span className={card.remainingSeconds < URGENT_SECONDS ? styles.urgent : undefined}>
                    {formatRemaining(card.remainingSeconds)} 남음
                  </span>
                </span>
              </span>
              <img className={styles.chevron} src={chevronIcon} alt="" />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}

export default PendingCardSheet
