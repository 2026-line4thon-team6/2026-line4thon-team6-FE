import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStoryImage, shareStory } from './storyImage'

// jsdom에는 캔버스 그리기가 없어, 호출만 기록하는 가짜 2D 컨텍스트로 바꾼다
function fakeContext() {
  const calls: { name: string; args: unknown[] }[] = []
  const gradient = { addColorStop: vi.fn() }
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'createLinearGradient') return () => gradient
      if (key === 'measureText') return (text: string) => ({ width: text.length * 40 })
      return (...args: unknown[]) => calls.push({ name: key, args })
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    },
  })
  return { ctx, calls }
}

let context: ReturnType<typeof fakeContext>
let canvas: HTMLCanvasElement | null = null

beforeEach(() => {
  context = fakeContext()
  // 만든 캔버스의 크기를 확인하려고 createElement('canvas')를 가로챈다
  const createElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
    const element = createElement(tagName, options)
    if (element instanceof HTMLCanvasElement) canvas = element
    return element
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context.ctx as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob(['png'], { type })))
  // 이미지는 바로 불러온 것으로 본다
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ''
      naturalWidth = 800
      naturalHeight = 600
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  canvas = null
})

describe('createStoryImage', () => {
  it('1080 × 1920 스토리 크기에 사진 · 제목 · 날짜가 들어간 폴라로이드를 그려 PNG로 돌려준다', async () => {
    const image = await createStoryImage({ photoUrl: '/photo.webp', title: '우리의 첫 바다 드라이브', date: '2026년 11월 3일' })

    expect(image.type).toBe('image/png')
    expect(canvas?.width).toBe(1080)
    expect(canvas?.height).toBe(1920)
    const texts = context.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0])
    expect(texts).toContain('우리의 첫 바다 드라이브')
    expect(texts).toContain('2026년 11월 3일')
    expect(context.calls.some((call) => call.name === 'drawImage')).toBe(true)
  })

  it('배경에 기록 지도와 사진 마커를 흐리게 그린 뒤, 그 위에 카드를 그린다 (Figma 284:15555)', async () => {
    await createStoryImage({
      photoUrl: '/photo.webp',
      title: '우리의 첫 바다 드라이브',
      date: '2026년 11월 3일',
      markers: [
        { latitude: 37.5665, longitude: 126.978, photoUrl: '/seoul.webp' },
        { latitude: 35.1796, longitude: 129.0756, photoUrl: '/busan.webp' },
      ],
    })

    const draws = context.calls.filter((call) => call.name === 'drawImage')
    // 지도 1 + 마커마다 말풍선 · 사진 · 점 3 + 카드 사진 1
    expect(draws).toHaveLength(1 + 2 * 3 + 1)
    expect(context.ctx.filter).toBe('none') // 흐림은 배경에만 쓰고 되돌린다
  })

  it('지도에서 서울은 부산보다 왼쪽 위에 마커를 놓는다', async () => {
    await createStoryImage({
      photoUrl: '/photo.webp',
      title: '',
      date: '',
      markers: [
        { latitude: 37.5665, longitude: 126.978, photoUrl: '/seoul.webp' },
        { latitude: 35.1796, longitude: 129.0756, photoUrl: '/busan.webp' },
      ],
    })

    // 마커 사진은 9개 인자 drawImage(이미지, sx, sy, sw, sh, dx, dy, dw, dh) 중 dx, dy로 위치를 본다
    const photos = context.calls.filter((call) => call.name === 'drawImage' && call.args.length === 9).slice(0, 2)
    const [seoul, busan] = photos.map((call) => ({ x: call.args[5] as number, y: call.args[6] as number }))
    expect(seoul!.x).toBeLessThan(busan!.x)
    expect(seoul!.y).toBeLessThan(busan!.y)
  })

  it('제목이 카드보다 길면 말줄임표로 줄인다', async () => {
    await createStoryImage({ photoUrl: '/photo.webp', title: '아주아주 길고 긴 드라이브 제목입니다 정말로 길어요', date: '2026년 11월 3일' })

    const title = context.calls.find((call) => call.name === 'fillText')?.args[0] as string
    expect(title.endsWith('…')).toBe(true)
  })
})

describe('shareStory', () => {
  it('스토리 이미지를 만들어 기기 공유 시트로 넘긴다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })

    const result = await shareStory({ photoUrl: '/photo.webp', title: '우리의 첫 바다 드라이브', date: '2026년 11월 3일' })

    expect(result).toBe('shared')
    expect((share.mock.calls[0] as [ShareData])[0].files?.[0]?.name).toBe('bunbungus-drive-story.png')
  })

  it('이미지를 만들지 못하면 unsupported를 돌려준다', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)

    expect(await shareStory({ photoUrl: '/photo.webp', title: '', date: '' })).toBe('unsupported')
  })
})
