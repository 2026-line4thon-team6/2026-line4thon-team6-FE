import markerDot from '@/assets/icons/record-marker-dot.svg'
import markerFrame from '@/assets/icons/record-marker-frame.svg'
import type { RecordMapMarker } from '@/types/record'
import styles from './RecordMarker.module.scss'

interface RecordMarkerProps {
  marker: RecordMapMarker
  onClick: (marker: RecordMapMarker) => void
}

// 기록 지도의 사진 마커. 말풍선 아래 점이 실제 좌표를 가리킨다 (지도에는 점이 좌표에 오도록 아래 기준으로 올린다)
function RecordMarker({ marker, onClick }: RecordMarkerProps) {
  const { latestCard, recordCount } = marker
  // 같은 목적지의 나머지 기록 수 (명세: +N = recordCount - 1)
  const more = recordCount - 1
  const label = more > 0 ? `${latestCard.title} 외 ${more}개 기록 보기` : `${latestCard.title} 기록 보기`

  return (
    <button type="button" className={styles.marker} aria-label={label} onClick={() => onClick(marker)}>
      <span className={styles.bubble}>
        <img className={styles.frame} src={markerFrame} alt="" width={94} height={101} />
        <img className={styles.photo} src={latestCard.thumbnailUrl} alt="" />
        {more > 0 && (
          <span className={styles.more} aria-hidden="true">
            +{more}
          </span>
        )}
      </span>
      <span className={styles.dot}>
        <img src={markerDot} alt="" width={50} height={50} />
      </span>
    </button>
  )
}

export default RecordMarker
