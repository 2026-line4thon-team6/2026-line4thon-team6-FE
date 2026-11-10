import { useRef } from 'react'
import type { DragEvent, MouseEvent, PointerEvent } from 'react'

// 이 거리(px) 이상 움직여야 드래그로 본다. 그보다 짧으면 일반 클릭이다
const DRAG_THRESHOLD = 5

// 가로 스크롤 목록을 마우스로 끌어서 넘길 수 있게 한다.
// 터치는 브라우저가 스크롤을 직접 처리하므로 마우스 입력만 다룬다.
// 사용 예) <ul className={styles.scroller} {...useDragScroll()} />
function useDragScroll<T extends HTMLElement>() {
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 })

  const end = () => {
    drag.current.active = false
  }

  return {
    onPointerDown: (event: PointerEvent<T>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      drag.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startScroll: event.currentTarget.scrollLeft,
      }
    },
    onPointerMove: (event: PointerEvent<T>) => {
      const state = drag.current
      if (!state.active) return
      // 목록 밖에서 버튼을 뗀 뒤 다시 들어온 경우
      if (event.buttons === 0) {
        end()
        return
      }
      const distance = event.clientX - state.startX
      if (!state.moved && Math.abs(distance) < DRAG_THRESHOLD) return
      state.moved = true
      event.currentTarget.scrollLeft = state.startScroll - distance
    },
    onPointerUp: end,
    onPointerCancel: end,
    // 드래그가 끝나며 발생하는 클릭이 카드·칩에 전달되지 않게 막는다
    onClickCapture: (event: MouseEvent<T>) => {
      if (!drag.current.moved) return
      drag.current.moved = false
      event.preventDefault()
      event.stopPropagation()
    },
    // 이미지를 끌 때 브라우저 기본 드래그(고스트 이미지)가 뜨지 않게 한다
    onDragStart: (event: DragEvent<T>) => {
      event.preventDefault()
    },
  }
}

export default useDragScroll
