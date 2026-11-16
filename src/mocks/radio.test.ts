import { describe, expect, it } from 'vitest'
import { mockFetchRadioEpisode, mockFetchRadioHistory } from './radio'

// API 명세 GET /radio/episodes 규칙(본인 USER_STORY만 최신순, q는 원사연 · 방송문구 검색)을 목 서버가 지키는지 확인한다
describe('보낸 사연 보관함', () => {
  it('보낸 사연을 최신순으로 돌려준다', async () => {
    const { data } = await mockFetchRadioHistory()

    expect(data.items).toHaveLength(10)
    expect(data.items.every((episode) => episode.mode === 'USER_STORY')).toBe(true)
    const times = data.items.map((episode) => Date.parse(episode.createdAt))
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })

  it('검색어가 사연이나 방송 문구에 들어 있는 것만 돌려준다', async () => {
    const { data } = await mockFetchRadioHistory('바다')

    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.every((episode) => `${episode.story} ${episode.broadcastText}`.includes('바다'))).toBe(true)
  })

  it('검색어 앞뒤 공백은 무시하고, 맞는 사연이 없으면 빈 목록', async () => {
    const { data: trimmed } = await mockFetchRadioHistory('  바다  ')
    const { data: none } = await mockFetchRadioHistory('없는검색어')

    expect(trimmed.items.length).toBeGreaterThan(0)
    expect(none.items).toEqual([])
  })

  it('limit만큼 잘라 주고 nextCursor로 이어서 불러온다 (기본 20개라 목 데이터 10개는 한 페이지)', async () => {
    const { data: all } = await mockFetchRadioHistory()
    expect(all).toMatchObject({ hasMore: false, nextCursor: null })

    const { data: first } = await mockFetchRadioHistory('', { limit: 4 })
    expect(first.items).toEqual(all.items.slice(0, 4))
    expect(first).toMatchObject({ hasMore: true, nextCursor: '4' })

    const { data: last } = await mockFetchRadioHistory('', { cursor: '8', limit: 4 })
    expect(last.items).toEqual(all.items.slice(8))
    expect(last).toMatchObject({ hasMore: false, nextCursor: null })
  })

  it('잘못된 cursor면 400', async () => {
    await expect(mockFetchRadioHistory('', { cursor: 'abc' })).rejects.toMatchObject({ status: 400 })
  })
})

// API 명세 GET /radio/episodes/{episodeId}: 생성자 본인의 사연 한 개 (방송 문구 · 임시 음성 URL)
describe('보낸 사연 상세', () => {
  it('사연 하나를 방송 문구와 함께 돌려준다', async () => {
    const { data } = await mockFetchRadioEpisode('rad_01')

    expect(data.id).toBe('rad_01')
    expect(data.broadcastText).toContain('붕붕이 DJ입니다')
  })

  it('없는 사연이면 404', async () => {
    await expect(mockFetchRadioEpisode('rad_none')).rejects.toMatchObject({ status: 404 })
  })
})
