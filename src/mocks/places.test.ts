import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetchFavorites, mockSetPlaceFavorite, resetMockPlaces } from './places'

// API 명세 GET /me/favorite-places 규칙(본인 찜만, category 생략 시 전체)을 목 서버가 지키는지 확인한다
beforeEach(() => {
  resetMockPlaces()
})

describe('찜한 장소 목록', () => {
  it('찜한 장소만 돌려준다', async () => {
    const { data } = await mockFetchFavorites()

    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.every((place) => place.isFavorite)).toBe(true)
    expect(data.hasMore).toBe(false)
    expect(data.nextCursor).toBeNull()
  })

  it('카테고리를 주면 그 카테고리만 돌려준다', async () => {
    const { data } = await mockFetchFavorites('SEA')

    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.every((place) => place.category === 'SEA')).toBe(true)
  })

  it('찜을 취소하면 다음 조회부터 빠지고, 다시 찜하면 들어온다', async () => {
    const { data: before } = await mockFetchFavorites()
    const target = before.items[0]

    await mockSetPlaceFavorite(target.id, false)
    const { data: removed } = await mockFetchFavorites()
    expect(removed.items.map((place) => place.id)).not.toContain(target.id)

    await mockSetPlaceFavorite(target.id, true)
    const { data: restored } = await mockFetchFavorites()
    expect(restored.items.map((place) => place.id)).toContain(target.id)
  })
})
