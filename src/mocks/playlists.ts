import type { ApiMeta, ApiResponse } from '@/types/api'
import type { SavedPlaylistPage } from '@/types/playlist'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 플레이리스트 보관함 목 응답. Figma 'My_UI > 플리 보관함'의 4개.
// 시안의 앨범 표지 대신 목 장소 사진을 대표 이미지로 쓴다
let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_playlist_${++requestCount}`, serverTime: new Date().toISOString() })

export const MOCK_PLAYLIST_LIBRARY: SavedPlaylistPage = {
  items: [
    { id: 'ply_01', title: '노을처럼 따뜻한 우리', trackCount: 13, durationSeconds: 3120, thumbnailUrl: '/mocks/spots/eurwangni.webp', driveId: 'drv_01', driveTitle: '우리의 첫 바다 드라이브' },
    { id: 'ply_02', title: '바다 보며 달리는 여름', trackCount: 13, durationSeconds: 2940, thumbnailUrl: '/mocks/spots/heonhwaro.webp', driveId: 'drv_02', driveTitle: '퇴근하고 떠난 드라이브' },
    { id: 'ply_03', title: '초록길 힐링 드라이브', trackCount: 13, durationSeconds: 3300, thumbnailUrl: '/mocks/spots/dumulmeori.webp', driveId: 'drv_03', driveTitle: '날씨가 좋아서 떠난 날' },
    { id: 'ply_04', title: '근교 카페 가는 길', trackCount: 13, durationSeconds: 3060, thumbnailUrl: '/mocks/spots/bukhangang-cafe.webp', driveId: 'drv_04', driveTitle: '밤바람 쐬러 가기' },
  ],
  nextCursor: null,
  hasMore: false,
  totalCount: 4,
}

export async function mockFetchPlaylistLibrary(): Promise<ApiResponse<SavedPlaylistPage>> {
  return { data: structuredClone(MOCK_PLAYLIST_LIBRARY), meta: meta() }
}
