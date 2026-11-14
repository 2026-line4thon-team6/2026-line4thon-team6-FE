import { afterEach, describe, expect, it } from 'vitest'
import { preventPageZoom } from './preventPageZoom'

// 앱 화면은 손가락으로 확대 · 축소하지 않는다. 지도는 카카오맵이 터치를 직접 처리해 그대로 확대된다
describe('preventPageZoom', () => {
  let stop: () => void = () => {}

  afterEach(() => stop())

  it.each(['gesturestart', 'gesturechange', 'gestureend'])(
    '아이폰 사파리의 핀치 확대(%s)를 막는다',
    (type) => {
      stop = preventPageZoom()

      const event = new Event(type, { cancelable: true })
      document.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    },
  )

  it('해제하면 다시 막지 않는다', () => {
    preventPageZoom()()

    const event = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})
