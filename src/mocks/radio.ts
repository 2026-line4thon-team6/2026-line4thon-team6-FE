import { ApiError } from '@/api/client'
import type { ApiMeta, ApiResponse, CursorPage } from '@/types/api'
import type { RadioEpisode } from '@/types/radio'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 라디오 사연 보관함 목 응답.
// Figma 'My_UI > 라디오 사연 보관함'의 10개 사연. 시안은 앞부분만 보여 주므로 뒷부분은 지어서 채운다
let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_radio_${++requestCount}`, serverTime: new Date().toISOString() })

const STORIES: [story: string, broadcastText: string][] = [
  // 첫 사연의 방송 문구는 Figma '보관함 상세'(812:10416)의 DJ 멘트
  [
    '오늘 날씨가 너무 좋아서 갑자기 바다 보러 가자고 했는데 흔쾌히 운전해줘서 고마워!',
    [
      '안녕하세요, 여러분! 붕붕이 DJ입니다. 🎙️',
      '오늘은 연인과 함께 바다로 드라이브를 떠난 한 분의 사연을 소개해 드릴게요.',
      '',
      '“오랜만에 남자친구와 바다를 보러 가게 됐어요. 평소에는 표현을 잘 못 하는 편인데, 오늘만큼은 운전해 주는 남자친구에게 고맙다는 말을 전하고 싶어요. 덕분에 가는 길마저 즐겁고 행복하거든요.”',
      '',
      '참 따뜻한 사연이죠? 어쩌면 여행에서 가장 기억에 남는 순간은 멋진 풍경보다도, 좋아하는 사람과 함께한 시간이 아닐까 싶어요.',
      '지금 옆에 있는 소중한 사람에게 작은 고마움 한마디 건네보는 건 어떨까요? 두 분의 남은 드라이브도 행복한 순간들로 가득하길 바라겠습니다.',
    ].join('\n'),
  ],
  ['바다 가는 길에 노래를 듣다가 우리 처음 만난 날 들었던 노래가 나와서 깜짝 놀랐어.', '추억의 노래가 흘러나온 바닷길, 두 분의 첫 만남이 떠오르는 순간이네요.'],
  ['어느덧 함께한지 백일이 됐어. 앞으로도 같이 많은 곳을 달려보자.', '백일을 맞은 두 분, 앞으로 함께 달릴 길이 더 기대돼요.'],
  ['솔로천국 커플지옥이라는 말이 있는데 우리는 커플천국인 것 같아.', '커플천국이라 말하는 두 분의 드라이브, 오늘도 행복이 가득하길 바라요.'],
  ['왜 그렇게 생각하는데? 라고 물어봐줘서 내 얘기를 끝까지 들어줘서 좋았어.', '끝까지 들어주는 마음, 그게 가장 큰 사랑이 아닐까요.'],
  ['찬성 입장도 생각을 해보니 네 말이 맞는 것 같기도 해. 다음엔 내가 양보할게.', '서로의 입장을 헤아리는 두 분, 다음 드라이브도 사이좋게 달려요.'],
  ['두 입장 중 뭐가 더 맞는지는 모르겠지만 같이 고민해줘서 고마워.', '함께 고민하는 시간도 두 분에겐 소중한 추억이 될 거예요.'],
  ['배가 너무 고파서 휴게소 들르자고 했는데 내가 좋아하는 호두과자 사줘서 감동이었어.', '휴게소 호두과자 한 봉지에 담긴 다정함, 오늘 드라이브의 하이라이트네요.'],
  ['드라이브 가다가 싸웠는데 먼저 미안하다고 말해줘서 고마웠어.', '먼저 건넨 사과 한마디가 길 위의 분위기를 바꿨어요.'],
  ['갑자기 나한테 전여친 얘기를 꺼내서 서운했지만 솔직하게 말해줘서 오히려 믿음이 갔어.', '솔직한 대화가 두 분 사이를 더 단단하게 만들어 줄 거예요.'],
]

// 최신 사연부터 하루씩 앞선 날짜
export const MOCK_RADIO_EPISODES: RadioEpisode[] = STORIES.map(([story, broadcastText], index) => ({
  id: `rad_${String(index + 1).padStart(2, '0')}`,
  driveId: `drv_${String(index + 1).padStart(2, '0')}`,
  mode: 'USER_STORY',
  story,
  broadcastText,
  audioUrl: null,
  audioUrlExpiresAt: null,
  durationSeconds: 60,
  status: 'READY',
  createdAt: new Date(Date.UTC(2026, 10, 12 - index, 9)).toISOString(),
}))

export async function mockFetchRadioHistory(q?: string): Promise<ApiResponse<CursorPage<RadioEpisode>>> {
  const keyword = q?.trim() ?? ''
  const items = MOCK_RADIO_EPISODES.filter(
    (episode) => !keyword || `${episode.story ?? ''} ${episode.broadcastText ?? ''}`.includes(keyword),
  )
  return { data: { items: structuredClone(items), nextCursor: null, hasMore: false }, meta: meta() }
}

// GET /radio/episodes/{episodeId}. 목 서버에는 음성 파일이 없어 audioUrl은 null
export async function mockFetchRadioEpisode(episodeId: string): Promise<ApiResponse<RadioEpisode>> {
  const episode = MOCK_RADIO_EPISODES.find(({ id }) => id === episodeId)
  if (!episode) {
    throw new ApiError(404, {
      error: { code: 'RESOURCE_NOT_FOUND', message: '사연을 찾을 수 없어요.', details: [], retryable: false },
      meta: meta(),
    })
  }
  return { data: structuredClone(episode), meta: meta() }
}
