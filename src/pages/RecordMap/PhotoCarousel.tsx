import { type TouchEvent, useRef } from 'react'
import RecordPhoto from '@/components/RecordPhoto/RecordPhoto'
import styles from './PhotoCarousel.module.scss'

interface PhotoCarouselProps {
  // 순서대로 보여 줄 사진 주소. null이면 기본 일러스트
  photos: (string | null)[]
  // 보여 줄 사진 순번. 화살표는 쓰는 화면에 둔다
  index: number
  // 손가락으로 넘겼을 때 바뀐 순번을 알린다
  onIndexChange: (index: number) => void
  // 크기는 쓰는 화면에서 정한다
  className?: string
}

// 이만큼 넘게 밀면 다음 · 이전 사진으로 넘긴다
const SWIPE_THRESHOLD = 40

// 기록 사진을 한 장씩 가로로 넘겨 본다 (스와이프 · 바깥 화살표).
// 스크롤로 넘기면 소수점 폭에서 옆 사진이 1px 남짓 남아 보여, 사진 줄을 transform으로 정확히 한 장씩 옮긴다
function PhotoCarousel({ photos, index, onIndexChange, className }: PhotoCarouselProps) {
  const startX = useRef<number | null>(null)
  const last = photos.length - 1

  const handleTouchStart = (event: TouchEvent) => {
    startX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent) => {
    const endX = event.changedTouches[0]?.clientX
    if (startX.current === null || endX === undefined) return
    const dx = endX - startX.current
    startX.current = null
    if (dx <= -SWIPE_THRESHOLD && index < last) onIndexChange(index + 1)
    if (dx >= SWIPE_THRESHOLD && index > 0) onIndexChange(index - 1)
  }

  return (
    <div
      className={[styles.carousel, className].filter(Boolean).join(' ')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ul className={styles.track} aria-label="드라이브 사진" style={{ transform: `translateX(-${index * 100}%)` }}>
        {photos.map((photo, i) => (
          <li key={`${i}-${photo}`} className={styles.slide} aria-hidden={i !== index}>
            <RecordPhoto className={styles.photo} src={photo} alt={`드라이브 사진 ${i + 1}`} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PhotoCarousel
