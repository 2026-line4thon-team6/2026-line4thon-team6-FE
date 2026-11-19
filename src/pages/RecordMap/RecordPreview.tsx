import { useEffect, useState } from 'react'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RecordPhoto from '@/components/RecordPhoto/RecordPhoto'
import useOverlay from '@/hooks/useOverlay'
import type { RecordMapCard, RecordMapMarker } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import styles from './RecordPreview.module.scss'
import SwipeCarousel from './SwipeCarousel'

interface RecordPreviewProps {
  marker: RecordMapMarker
  onOpen: (card: RecordMapCard) => void
  onShare: (card: RecordMapCard) => void
  onClose: () => void
  // 같은 장소에 모인 기록들을 불러온다 (대표 카드가 맨 앞). 지도 응답에는 대표 카드 한 장만 있다
  loadGroup?: (marker: RecordMapMarker) => Promise<RecordMapCard[]>
}

// 사진 마커를 누르면 지도를 흐리게 하고 띄우는 폴라로이드 카드 (Figma 284:15043).
// 같은 장소에 기록이 여러 개면 대표 카드부터 보여 주고, 양옆 화살표 · 끌기로 다른 기록 카드를 넘겨 본다
function RecordPreview({ marker, onOpen, onShare, onClose, loadGroup }: RecordPreviewProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)
  // 불러오기 전 · 실패면 대표 카드 한 장만
  const [cards, setCards] = useState<RecordMapCard[]>([marker.latestCard])
  const [index, setIndex] = useState(0)
  const card = cards[index] ?? marker.latestCard

  useEffect(() => {
    if (!loadGroup || marker.recordCount < 2) return
    let ignore = false
    loadGroup(marker)
      .then((group) => {
        if (!ignore && group.length > 0) setCards(group)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [marker, loadGroup])

  const slides = cards.map((item) => ({
    key: item.cardId,
    content: (
      <>
        <RecordPhoto className={styles.photo} src={item.thumbnailUrl} />
        <button type="button" className={styles.text} aria-label={`${item.title} 기록 자세히 보기`}>
          <span className={styles.title}>{item.title}</span>
          <span className={styles.date}>{formatDate(item.driveDate)}</span>
        </button>
      </>
    ),
  }))

  return (
    <div ref={ref} className={styles.overlay} role="dialog" aria-modal="true" aria-label="드라이브 기록 미리보기" tabIndex={-1}>
      <div className={styles.backdrop} data-testid="record-preview-backdrop" onClick={onClose} />

      <div className={styles.content}>
        <GlassIconButton className={styles.share} icon="share" aria-label="공유하기" onClick={() => onShare(card)} />

        <div className={styles.cardRow}>
          {/* 사진 · 제목 어디를 눌러도 지금 보이는 기록의 상세로 간다. 키보드 · 스크린리더는 제목 버튼을 쓴다 */}
          <div className={styles.card} onClick={() => onOpen(card)}>
            <SwipeCarousel
              className={styles.carousel}
              slideClassName={styles.slide}
              slides={slides}
              label="이 장소의 드라이브 기록"
              index={index}
              onIndexChange={setIndex}
            />
          </div>

          {/* 카드 양옆 화살표 (Figma 97:7346 뒤로가기 버튼, '다음'은 좌우반전) */}
          {index > 0 && (
            <GlassIconButton
              className={[styles.arrow, styles.prev].join(' ')}
              icon="back"
              aria-label="이전 기록"
              onClick={() => setIndex(index - 1)}
            />
          )}
          {index < cards.length - 1 && (
            <GlassIconButton
              className={[styles.arrow, styles.next].join(' ')}
              icon="back"
              aria-label="다음 기록"
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
