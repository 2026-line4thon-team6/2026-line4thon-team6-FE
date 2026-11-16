import { describe, expect, it } from 'vitest'
import { photoRefreshDelay } from './photoRefresh'

const photo = (urlExpiresAt: string) => ({ mediaId: 'm', url: 'u', urlExpiresAt, order: 0 })
const NOW = Date.parse('2026-11-16T00:00:00Z')

describe('photoRefreshDelay', () => {
  it('가장 먼저 만료되는 사진 링크의 30초 전까지 남은 시간을 돌려준다', () => {
    const delay = photoRefreshDelay([photo('2026-11-16T00:10:00Z'), photo('2026-11-16T00:05:00Z')], NOW)

    expect(delay).toBe(5 * 60_000 - 30_000)
  })

  it('이미 만료가 가까우면 바로(0) 새로 받는다', () => {
    expect(photoRefreshDelay([photo('2026-11-16T00:00:10Z')], NOW)).toBe(0)
  })

  it('사진이 없거나 타이머로 잴 수 없을 만큼 멀면 null', () => {
    expect(photoRefreshDelay([], NOW)).toBeNull()
    expect(photoRefreshDelay([photo('2099-01-01T00:00:00Z')], NOW)).toBeNull()
  })
})
