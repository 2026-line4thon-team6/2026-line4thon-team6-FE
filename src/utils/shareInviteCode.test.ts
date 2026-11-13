import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareInviteCode } from './share'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('shareInviteCode', () => {
  it('기기 공유 화면이 있으면 코드를 담아 연다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    await expect(shareInviteCode('ab12cd34')).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('ab12cd34') }))
  })

  it('공유 시트를 닫아도(AbortError) 오류로 다루지 않는다', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')) })

    await expect(shareInviteCode('ab12cd34')).resolves.toBe('shared')
  })

  it('공유 화면이 없으면 코드를 복사한다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(shareInviteCode('ab12cd34')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('ab12cd34')
  })
})
