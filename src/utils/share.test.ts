import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareImage } from './share'

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
