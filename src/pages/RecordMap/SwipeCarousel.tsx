import { type MouseEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react'
import styles from './SwipeCarousel.module.scss'

export interface CarouselSlide {
  key: string
  content: ReactNode
}

interface SwipeCarouselProps {
  slides: CarouselSlide[]
  // 목록 이름 (스크린리더)
  label: string
  // 보여 줄 순번. 화살표는 쓰는 화면에 둔다
  index: number
  // 끌어서 넘겼을 때 바뀐 순번을 알린다
  onIndexChange: (index: number) => void
  className?: string
  slideClassName?: string
}

// 폭의 이만큼 넘게 밀면 다음 · 이전으로 넘긴다
const SWIPE_RATIO = 0.2
// 이보다 적게 움직였으면 누른 것으로 본다
const TAP_SLOP = 6
// 처음 · 마지막에서 더 밀면 덜 따라오게 한다
const EDGE_RESISTANCE = 0.3

// 한 장씩 가로로 넘겨 본다 (손가락 · 마우스로 끌어 넘기기 + 바깥 화살표).
// 스크롤로 넘기면 소수점 폭에서 옆 장이 1px 남짓 남아 보여, 줄 전체를 transform으로 정확히 한 장씩 옮긴다
function SwipeCarousel({ slides, label, index, onIndexChange, className, slideClassName }: SwipeCarouselProps) {
  const drag = useRef<{ startX: number; width: number; moved: boolean; dx: number } | null>(null)
  const dragged = useRef(false)
  const [offset, setOffset] = useState<number | null>(null)
  const last = slides.length - 1

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (last < 1 || (event.pointerType === 'mouse' && event.button !== 0)) return
    drag.current = { startX: event.clientX, width: event.currentTarget.clientWidth, moved: false, dx: 0 }
    dragged.current = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current) return
    let dx = event.clientX - current.startX
    if (!current.moved) {
      if (Math.abs(dx) < TAP_SLOP) return
      current.moved = true
      // 영역 밖으로 나가도 끝까지 따라오게 한다
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    current.dx = dx
    if ((index === 0 && dx > 0) || (index === last && dx < 0)) dx *= EDGE_RESISTANCE
    setOffset(dx)
  }

  const finishDrag = () => {
    const current = drag.current
    drag.current = null
    if (!current?.moved) return
    dragged.current = true
    const { dx } = current
    setOffset(null)
    const threshold = current.width * SWIPE_RATIO
    if (dx <= -threshold && index < last) onIndexChange(index + 1)
    else if (dx >= threshold && index > 0) onIndexChange(index - 1)
  }

  // 끌어서 넘긴 뒤 손을 뗄 때 생기는 클릭은 카드 열기로 번지지 않게 막는다
  const handleClickCapture = (event: MouseEvent) => {
    if (!dragged.current) return
    dragged.current = false
    event.stopPropagation()
  }

  const translate = offset === null ? `translateX(-${index * 100}%)` : `translateX(calc(-${index * 100}% + ${offset}px))`

  return (
    <div
      className={[styles.carousel, className].filter(Boolean).join(' ')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}
    >
      <ul
        className={[styles.track, offset !== null && styles.dragging].filter(Boolean).join(' ')}
        aria-label={label}
        style={{ transform: translate }}
      >
        {slides.map((slide, i) => (
          // 보이지 않는 장은 초점 · 스크린리더에서 뺀다
          <li key={slide.key} className={[styles.slide, slideClassName].filter(Boolean).join(' ')} inert={i !== index}>
            {slide.content}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SwipeCarousel
