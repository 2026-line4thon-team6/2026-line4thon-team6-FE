import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadOnStaleChunk } from './reloadOnStaleChunk'

// 앱을 켜 둔 채 새 배포가 올라가면, 아직 열지 않은 페이지 코드(예전 배포의 파일 이름)를 받지 못한다.
// Vite가 보내는 vite:preloadError를 받으면 한 번 새로고침해 새 배포의 코드를 받는다
describe('reloadOnStaleChunk', () => {
  let stop: () => void = () => {}
  let now = 0
  const reload = vi.fn()

  const fail = () => {
    const event = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    sessionStorage.clear()
    reload.mockClear()
    now = 1_000_000
    stop = reloadOnStaleChunk({ reload, now: () => now })
  })

  afterEach(() => stop())

  it('페이지 코드를 받지 못하면 새로고침하고, 오류를 그대로 던지지 않는다', () => {
    const event = fail()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('새로고침한 뒤 10초 안에 또 실패하면(오프라인 등) 다시 새로고침하지 않고 오류를 그대로 둔다', () => {
    fail()
    now += 9_000
    const event = fail()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(false)
  })

  it('10초가 지난 뒤 실패하면 다시 새로고침한다', () => {
    fail()
    now += 11_000
    fail()

    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('해제하면 더는 새로고침하지 않는다', () => {
    stop()
    fail()

    expect(reload).not.toHaveBeenCalled()
  })
})
