import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPwaInstall } from './pwaInstall'

// 앱 설치(PWA). 크롬 · 삼성 인터넷은 설치 창 이벤트(beforeinstallprompt)를 앱 시작 직후 한 번 보내므로 미리 받아 둔다
const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 }
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 }
const GALAXY = { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921N)', platform: 'Linux armv8l', maxTouchPoints: 5 }

function installPromptEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: string }>
  }
  event.prompt = vi.fn(() => Promise.resolve())
  event.userChoice = Promise.resolve({ outcome })
  return event
}

let stop = () => {}
afterEach(() => stop())

function setup({ device = GALAXY, standalone = false } = {}) {
  const pwa = createPwaInstall({ target: window, device, isStandalone: () => standalone })
  stop = pwa.start()
  return pwa
}

describe('설치 방법', () => {
  it('설치 창을 받기 전 안드로이드는 브라우저 메뉴 안내, 아이폰 · 아이패드는 공유 메뉴 안내', () => {
    expect(setup().getMode()).toBe('manual')
    stop()
    expect(setup({ device: IPHONE }).getMode()).toBe('ios')
    stop()
    expect(setup({ device: IPAD }).getMode()).toBe('ios')
  })

  it('이미 앱으로 실행 중이면 설치 메뉴를 숨긴다', () => {
    expect(setup({ standalone: true }).getMode()).toBeNull()
  })

  it('브라우저가 설치 창을 주면 바로 설치할 수 있다 (기본 안내 배너는 띄우지 않는다)', () => {
    const pwa = setup()
    const event = installPromptEvent('accepted')

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(pwa.getMode()).toBe('prompt')
  })
})

describe('설치하기', () => {
  it('설치 창을 띄우고, 설치하면 메뉴를 숨긴다', async () => {
    const pwa = setup()
    const listener = vi.fn()
    pwa.subscribe(listener)
    const event = installPromptEvent('accepted')
    window.dispatchEvent(event)

    await expect(pwa.prompt()).resolves.toBe('accepted')

    expect(event.prompt).toHaveBeenCalled()
    window.dispatchEvent(new Event('appinstalled'))
    expect(pwa.getMode()).toBeNull()
    expect(listener).toHaveBeenCalled()
  })

  it('설치 창은 한 번만 쓸 수 있어, 취소하면 다음 이벤트를 받을 때까지 안내로 돌아간다', async () => {
    const pwa = setup()
    window.dispatchEvent(installPromptEvent('dismissed'))

    await expect(pwa.prompt()).resolves.toBe('dismissed')

    expect(pwa.getMode()).toBe('manual')
  })

  it('설치 창이 없으면 아무것도 하지 않는다', async () => {
    await expect(setup().prompt()).resolves.toBe('unavailable')
  })
})
