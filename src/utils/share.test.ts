import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyImage, saveImage, shareImage } from './share'

const IMAGE = new Blob(['png'], { type: 'image/png' })

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubNavigator(overrides: Partial<Navigator>) {
  vi.stubGlobal('navigator', { ...navigator, ...overrides })
}

describe('shareImage', () => {
  it('파일 공유를 지원하면 이미지 파일을 기기 공유 시트로 넘긴다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ canShare: () => true, share })

    const result = await shareImage(IMAGE, { fileName: 'drive-story.png', title: '우리의 첫 바다 드라이브' })

    expect(result).toBe('shared')
    const [data] = share.mock.calls[0] as [ShareData]
    expect(data.title).toBe('우리의 첫 바다 드라이브')
    expect(data.files?.[0]).toBeInstanceOf(File)
    expect(data.files?.[0]?.name).toBe('drive-story.png')
    expect(data.files?.[0]?.type).toBe('image/png')
  })

  it('사용자가 공유 시트를 닫으면 cancelled를 돌려준다', async () => {
    stubNavigator({ canShare: () => true, share: vi.fn().mockRejectedValue(new DOMException('', 'AbortError')) })

    expect(await shareImage(IMAGE, { fileName: 'a.png', title: '' })).toBe('cancelled')
  })

  it('파일 공유를 지원하지 않거나 공유에 실패하면 unsupported를 돌려준다', async () => {
    stubNavigator({ canShare: () => false, share: vi.fn() })
    expect(await shareImage(IMAGE, { fileName: 'a.png', title: '' })).toBe('unsupported')

    stubNavigator({ canShare: undefined, share: undefined })
    expect(await shareImage(IMAGE, { fileName: 'a.png', title: '' })).toBe('unsupported')

    stubNavigator({ canShare: () => true, share: vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')) })
    expect(await shareImage(IMAGE, { fileName: 'a.png', title: '' })).toBe('unsupported')
  })
})

// 기록 공유 시트의 '이미지 복사': 클립보드에 PNG를 넣는다. 아이폰 사파리는 누른 순간에 써야 해서 만들고 있는 이미지(Promise)를 그대로 넘긴다
describe('copyImage', () => {
  it('만들고 있는 이미지를 기다리지 않고 바로 클립보드에 PNG로 넣는다', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ clipboard: { write } as unknown as Clipboard })
    const items: Record<string, unknown>[] = []
    vi.stubGlobal('ClipboardItem', class {
      constructor(data: Record<string, unknown>) {
        items.push(data)
      }
    })

    const image = Promise.resolve(IMAGE)
    await copyImage(() => image)

    expect(write).toHaveBeenCalledTimes(1)
    expect(items[0]?.['image/png']).toBe(image)
  })

  it('이미지 복사를 지원하지 않는 브라우저면 이미지를 만들지 않고 거절한다', async () => {
    vi.stubGlobal('ClipboardItem', undefined)
    const createImage = vi.fn(() => Promise.resolve(IMAGE))

    await expect(copyImage(createImage)).rejects.toThrow()
    expect(createImage).not.toHaveBeenCalled()
  })
})

// '이미지 저장': 휴대폰은 공유 시트(이미지 저장 선택), 그 밖에는 PNG 파일로 내려받는다
describe('saveImage', () => {
  it('휴대폰에서 파일 공유를 지원하면 공유 시트로 넘긴다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ canShare: () => true, share })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    expect(await saveImage(IMAGE, 'drive.png')).toBe('shared')
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('데스크톱에서는 PNG 파일로 내려받는다', async () => {
    stubNavigator({ canShare: () => true, share: vi.fn() })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    URL.createObjectURL = vi.fn(() => 'blob:drive')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(await saveImage(IMAGE, 'drive.png')).toBe('downloaded')
    const anchor = click.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.download).toBe('drive.png')
    expect(anchor.href).toBe('blob:drive')
    click.mockRestore()
  })
})
