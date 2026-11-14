import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import useOverlay from '@/hooks/useOverlay'
import type { RecordMapCard } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import styles from './RecordPreview.module.scss'

interface RecordPreviewProps {
  card: RecordMapCard
  onOpen: (card: RecordMapCard) => void
  onShare: (card: RecordMapCard) => void
  onClose: () => void
}

// 사진 마커를 누르면 지도를 흐리게 하고 띄우는 폴라로이드 카드 (Figma 284:15043)
function RecordPreview({ card, onOpen, onShare, onClose }: RecordPreviewProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)

  return (
    <div ref={ref} className={styles.overlay} role="dialog" aria-modal="true" aria-label="드라이브 기록 미리보기" tabIndex={-1}>
      <div className={styles.backdrop} data-testid="record-preview-backdrop" onClick={onClose} />

      <GlassIconButton className={styles.share} icon="share" aria-label="공유하기" onClick={() => onShare(card)} />

      <button
        type="button"
        className={styles.card}
        aria-label={`${card.title} 기록 자세히 보기`}
        onClick={() => onOpen(card)}
      >
        <img className={styles.photo} src={card.thumbnailUrl} alt="" />
        <span className={styles.text}>
          <span className={styles.title}>{card.title}</span>
          <span className={styles.date}>{formatDate(card.driveDate)}</span>
        </span>
      </button>

      <p className={styles.hint}>카드를 눌러 자세한 기록을 확인해 보세요.</p>
    </div>
  )
}

export default RecordPreview
