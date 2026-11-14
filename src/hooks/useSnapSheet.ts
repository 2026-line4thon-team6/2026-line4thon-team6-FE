import { useRef, useState, type PointerEvent } from 'react'

export type SheetSnap = 'collapsed' | 'default' | 'full'

const SNAPS: SheetSnap[] = ['collapsed', 'default', 'full']
const TAP_SLOP = 5
const FLICK_MS = 200

interface Drag {
  startY: number
  startHeight: number
  lastY: number
  lastTime: number
  velocity: number
  moved: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function useSnapSheet(heights: Record<SheetSnap, number>) {
  const [snap, setSnap] = useState<SheetSnap>('default')
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const drag = useRef<Drag | null>(null)

  const height = dragHeight ?? heights[snap]
  const heightAt = (d: Drag) => clamp(d.startHeight - (d.lastY - d.startY), heights.collapsed, heights.full)

  const toggle = () => setSnap((value) => (value === 'full' ? 'default' : value === 'collapsed' ? 'default' : 'full'))

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = {
      startY: event.clientY,
      startHeight: height,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const dt = event.timeStamp - d.lastTime
    if (dt > 0) d.velocity = (event.clientY - d.lastY) / dt
    d.lastY = event.clientY
    d.lastTime = event.timeStamp
    if (Math.abs(d.lastY - d.startY) > TAP_SLOP) d.moved = true
    if (d.moved) setDragHeight(heightAt(d))
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      toggle()
      return
    }
    const projected = heightAt(d) - d.velocity * FLICK_MS
    const nearest = SNAPS.reduce((best, s) =>
      Math.abs(heights[s] - projected) < Math.abs(heights[best] - projected) ? s : best,
    )
    setSnap(nearest)
    setDragHeight(null)
  }

  return {
    snap,
    height,
    dragging: dragHeight !== null,
    toggle,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}

export default useSnapSheet
