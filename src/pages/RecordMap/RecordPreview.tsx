import { useEffect, useState } from 'react'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import useOverlay from '@/hooks/useOverlay'
import type { RecordMapCard } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import styles from './RecordPreview.module.scss'
import PhotoCarousel from './PhotoCarousel'

interface RecordPreviewProps {
  card: RecordMapCard
  onOpen: (card: RecordMapCard) => void
  onShare: (card: RecordMapCard) => void
  onClose: () => void
  // 저장된 사진 주소들(최대 2장)을 불러온다. 지도 응답에는 대표 사진 한 장만 있어 카드 상세(GET /cards/{cardId})에서 받는다
  loadPhotos?: (cardId: string) => Promise<string[]>
}

// 사진 마커를 누르면 지도를 흐리게 하고 띄우는 폴라로이드 카드 (Figma 284:15043)
function RecordPreview({ card, onOpen, onShare, onClose, loadPhotos }: RecordPreviewProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)
  // 불러오기 전 · 실패 · 사진 없음이면 대표 사진 한 장만 보여 준다
  const [photos, setPhotos] = useState<string[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!loadPhotos) return
    let ignore = false
    loadPhotos(card.cardId)
      .then((urls) => {
        if (!ignore) setPhotos(urls)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [card.cardId, loadPhotos])

  const slides = photos.length > 0 ? photos : [card.thumbnailUrl]

  return (
    <div ref={ref} className={styles.overlay} role="dialog" aria-modal="true" aria-label="드라이브 기록 미리보기" tabIndex={-1}>
      <div className={styles.backdrop} data-testid="record-preview-backdrop" onClick={onClose} />

      <div className={styles.content}>
        <GlassIconButton className={styles.share} icon="share" aria-label="공유하기" onClick={() => onShare(card)} />

        <div className={styles.cardRow}>
          {/* 사진 · 제목 어디를 눌러도 상세로 간다. 사진 목록은 버튼 안에 넣을 수 없어, 키보드 · 스크린리더는 제목 버튼을 쓴다 */}
          <div className={styles.card} onClick={() => onOpen(card)}>
            <PhotoCarousel className={styles.photo} photos={slides} index={index} onIndexChange={setIndex} />
            <button type="button" className={styles.text} aria-label={`${card.title} 기록 자세히 보기`}>
              <span className={styles.title}>{card.title}</span>
              <span className={styles.date}>{formatDate(card.driveDate)}</span>
            </button>
          </div>

          {/* 카드 양옆 화살표 (Figma 97:7346 뒤로가기 버튼, '다음'은 좌우반전) */}
          {index > 0 && (
            <GlassIconButton
              className={[styles.arrow, styles.prev].join(' ')}
              icon="back"
              aria-label="이전 사진"
              onClick={() => setIndex(index - 1)}
            />
          )}
          {index < slides.length - 1 && (
            <GlassIconButton
              className={[styles.arrow, styles.next].join(' ')}
              icon="back"
              aria-label="다음 사진"
              onClick={() => setIndex(index + 1)}
            />
          )}
        </div>

        <p className={styles.hint}>카드를 눌러 자세한 기록을 확인해 보세요.</p>
      </div>
    </div>
  )
}

export default RecordPreview
