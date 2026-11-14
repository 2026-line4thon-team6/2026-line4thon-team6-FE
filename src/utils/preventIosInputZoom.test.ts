import { afterEach, describe, expect, it } from 'vitest'
import { preventIosInputZoom } from './preventIosInputZoom'

const BASE = 'width=device-width, initial-scale=1.0, viewport-fit=cover'

function setup(content = BASE) {
  document.head.innerHTML = `<meta name="viewport" content="${content}" />`
  return document.querySelector<HTMLMetaElement>('meta[name="viewport"]')!
}

const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 }
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 }
const MAC = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 }
const GALAXY = { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921N)', platform: 'Linux armv8l', maxTouchPoints: 5 }

afterEach(() => {
  document.head.innerHTML = ''
})

describe('preventIosInputZoom', () => {
  it.each([
    ['아이폰', IPHONE],
    ['아이패드(데스크톱 모드 UA)', IPAD],
  ])('%s에서는 입력칸을 눌러도 확대되지 않게 maximum-scale=1을 붙인다', (_, device) => {
    const meta = setup()

    preventIosInputZoom(device)

    expect(meta.content).toBe(`${BASE}, maximum-scale=1`)
  })

  it.each([
    ['갤럭시(안드로이드는 핀치 확대까지 막히므로 건드리지 않는다)', GALAXY],
    ['맥 데스크톱', MAC],
  ])('%s에서는 그대로 둔다', (_, device) => {
    const meta = setup()

    preventIosInputZoom(device)

    expect(meta.content).toBe(BASE)
  })

  it('이미 붙어 있으면 다시 붙이지 않는다', () => {
    const meta = setup(`${BASE}, maximum-scale=1`)

    preventIosInputZoom(IPHONE)

    expect(meta.content).toBe(`${BASE}, maximum-scale=1`)
  })
})
