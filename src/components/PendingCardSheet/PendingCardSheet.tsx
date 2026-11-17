import { useState, ViewTransition } from 'react'
import chevronIcon from '@/assets/icons/record-chevron.svg'
import trashIcon from '@/assets/icons/trash.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import { DELETE_CARD_ERRORS, type DeleteOutcome } from '@/hooks/useCardDetail'
import type { PendingCardItem } from '@/hooks/usePendingCards'
import DeleteCardModal from '@/pages/RecordDetail/DeleteCardModal'
import { CARD_TITLE_SHARE, cardTitleTransitionName } from '@/utils/cardTransition'
import { formatRemaining } from '@/utils/cardFormat'
import styles from './PendingCardSheet.module.scss'

interface PendingCardSheetProps {
  cards: PendingCardItem[] // 마감순
  onSelect: (driveId: string) => void
  onClose: () => void
  // 아무도 쓰지 않은 카드를 지운다 (쓰기 시작한 카드는 서버가 거절해 휴지통을 두지 않는다)
  onDiscard?: (driveId: string) => Promise<DeleteOutcome>
}

// 1시간도 안 남은 카드는 남은 시간을 코랄로 강조한다
const URGENT_SECONDS = 60 * 60

// 마친 날은 한국 시간 기준 (예: '11월 16일')
const endedDate = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })

// 미작성 카드가 2개 이상일 때 배너를 누르면 뜨는 목록. 골라서 그 카드를 쓰러 간다
function PendingCardSheet({ cards, onSelect, onClose, onDiscard }: PendingCardSheetProps) {
  // 지우려고 고른 카드의 드라이브 id (확인 팝업)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const closeConfirm = () => {
    setConfirming(null)
    setDeleteError(null)
  }

  const handleDiscard = async () => {
    if (!confirming || !onDiscard) return
    setDeleting(true)
    setDeleteError(null)
    const outcome = await onDiscard(confirming)
    setDeleting(false)
    if (outcome === 'deleted') closeConfirm()
    else setDeleteError(DELETE_CARD_ERRORS[outcome])
  }

  return (
    <>
      <BottomSheet aria-label="작성하지 않은 드라이브 카드" onClose={onClose}>
        <h2 className={styles.title}>작성하지 않은 카드 {cards.length}개</h2>
        <p className={styles.description}>마친 지 24시간이 지나면 카드가 사라져요.</p>
        <ul className={styles.list}>
          {cards.map((card) => (
            <li key={card.cardId} className={styles.item}>
              <button type="button" className={styles.row} onClick={() => onSelect(card.driveId)}>
                <span className={styles.text}>
                  <span className={styles.name}>
                    {/* 누르면 이 이름이 카드 작성 화면의 제목 자리로 이어진다 (공유 요소 화면 전환) */}
                    <ViewTransition name={cardTitleTransitionName(card.driveId)} share={CARD_TITLE_SHARE} default="none">
                      <span className={styles.nameText}>{card.title}</span>
                    </ViewTransition>
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
                {/* 휴지통 자리를 비워 두고, 실제 버튼은 줄 버튼 밖에 겹쳐 둔다 (버튼 안에 버튼을 둘 수 없다) */}
                {onDiscard && !card.writing && <span className={styles.trashSpace} aria-hidden />}
                <img className={styles.chevron} src={chevronIcon} alt="" />
              </button>
              {onDiscard && !card.writing && (
                <button
                  type="button"
                  className={styles.trash}
                  aria-label={`${card.title} 지우기`}
                  onClick={() => setConfirming(card.driveId)}
                >
                  <img src={trashIcon} alt="" width={18} height={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </BottomSheet>
      {confirming && (
        <DeleteCardModal deleting={deleting} error={deleteError} onConfirm={() => void handleDiscard()} onClose={closeConfirm} />
      )}
    </>
  )
}

export default PendingCardSheet
