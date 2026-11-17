import { act, renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { describe, expect, it } from 'vitest'
import useSnapSheet from './useSnapSheet'

const heights = { collapsed: 94, default: 268, full: 800 }

const pointer = (clientY: number, timeStamp: number) =>
  ({ clientY, timeStamp, pointerId: 1, currentTarget: { setPointerCapture: () => {} } }) as unknown as PointerEvent<HTMLElement>

// y에서 시작해 path의 y로 차례대로 움직인 뒤 손을 뗀다 (한 칸에 16ms)
function swipe(result: { current: ReturnType<typeof useSnapSheet> }, from: number, path: number[]) {
  act(() => result.current.handleProps.onPointerDown(pointer(from, 0)))
  path.forEach((y, i) => act(() => result.current.handleProps.onPointerMove(pointer(y, (i + 1) * 16))))
  act(() => result.current.handleProps.onPointerUp())
}

describe('useSnapSheet', () => {
  it('기본 높이에서 시작하고, 끄는 동안 손가락을 따라 높이가 바뀐다', () => {
    const { result } = renderHook(() => useSnapSheet(heights))
    expect(result.current).toMatchObject({ snap: 'default', height: 268 })

    act(() => result.current.handleProps.onPointerDown(pointer(500, 0)))
    act(() => result.current.handleProps.onPointerMove(pointer(400, 500)))
    expect(result.current.height).toBe(368)
    expect(result.current.dragging).toBe(true)
  })

  it('천천히 놓으면 가장 가까운 단계로 붙는다', () => {
    const { result } = renderHook(() => useSnapSheet(heights))

    // 268 → 600: full(800)보다 default(268)에서 멀어 full에 가깝다
    act(() => result.current.handleProps.onPointerDown(pointer(500, 0)))
    act(() => result.current.handleProps.onPointerMove(pointer(168, 2000)))
    act(() => result.current.handleProps.onPointerUp())
    expect(result.current).toMatchObject({ snap: 'full', height: 800, dragging: false })
  })

  it('살짝 튕기면 그 방향의 다음 단계로 간다', () => {
    const { result } = renderHook(() => useSnapSheet(heights))

    swipe(result, 500, [490, 470, 440])
    expect(result.current.snap).toBe('full')

    swipe(result, 100, [110, 130, 160, 200, 240])
    swipe(result, 600, [610, 630, 660])
    expect(result.current.snap).toBe('collapsed')
  })

  it('짧게 누르면 기본 ↔ 전체를 오간다', () => {
    const { result } = renderHook(() => useSnapSheet(heights))

    swipe(result, 500, [501])
    expect(result.current.snap).toBe('full')
    swipe(result, 500, [])
    expect(result.current.snap).toBe('default')
  })

  describe('손잡이 + 탭 영역', () => {
    it('살짝 누르거나 10px 안쪽으로만 움직이면 시트는 그대로다 (탭은 그대로 눌린다)', () => {
      const { result } = renderHook(() => useSnapSheet(heights))

      act(() => result.current.areaProps.onPointerDown(pointer(500, 0)))
      act(() => result.current.areaProps.onPointerMove(pointer(492, 16)))
      act(() => result.current.areaProps.onPointerUp())

      expect(result.current).toMatchObject({ snap: 'default', height: 268, dragging: false })
    })

    it('위아래로 10px 넘게 끌면 시트를 움직인다', () => {
      const { result } = renderHook(() => useSnapSheet(heights))

      act(() => result.current.areaProps.onPointerDown(pointer(500, 0)))
      act(() => result.current.areaProps.onPointerMove(pointer(168, 2000)))
      act(() => result.current.areaProps.onPointerUp())

      expect(result.current.snap).toBe('full')
    })
  })
})
