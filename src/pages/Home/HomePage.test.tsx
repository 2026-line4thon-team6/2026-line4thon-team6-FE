import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import type { SpotSummary } from '@/types/spot'
import HomePage from './HomePage'

// 기능명세서 '1️⃣ 메인 홈', '2️⃣ 스마트 탐색 & 큐레이션' 기준
type Props = ComponentProps<typeof HomePage>

function renderHome(props: Partial<Props> = {}) {
  const handlers = {
    onNotificationClick: vi.fn(),
    onStartDrive: vi.fn(),
    onSpotClick: vi.fn(),
    onLikeToggle: vi.fn(),
    onTabChange: vi.fn(),
  }
  render(
    <HomePage
      home={MOCK_HOME}
      categories={MOCK_CATEGORIES}
      spots={MOCK_SPOTS}
      carConnected
      timeOfDay="evening"
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

const curation = () => screen.getByRole('region', { name: '스마트 탐색 & 큐레이션' })
const banner = () => screen.getByRole('region', { name: '드라이브 준비' })
const spotNames = () =>
  within(curation())
    .queryAllByRole('article')
    .map((card) => within(card).getByRole('heading').textContent)

describe('상단 프로필 · 인사말', () => {
  it('붕붕이 이름과 D+일수를 표시한다', () => {
    renderHome({ home: { ...MOCK_HOME, mascotName: '씽씽이', daysTogether: 100 } })

    expect(screen.getByText('씽씽이')).toBeInTheDocument()
    expect(screen.getByText('D+100')).toBeInTheDocument()
  })

  it('시작일 당일(1일째)은 D+1로 표시한다', () => {
    renderHome({ home: { ...MOCK_HOME, daysTogether: 1 } })

    expect(screen.getByText('D+1')).toBeInTheDocument()
  })

  it('인사말에 사용자 이름을 넣는다', () => {
    renderHome({ home: { ...MOCK_HOME, nickname: '지수' } })

    const greeting = screen.getByRole('heading', { level: 1 })
    expect(greeting).toHaveTextContent('안녕하세요, 지수님!')
    expect(greeting).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })
})

describe('알림 아이콘', () => {
  it('읽지 않은 알림이 있으면 새 알림 표시를 한다', () => {
    renderHome({ home: { ...MOCK_HOME, unreadNotificationCount: 3 } })

    expect(screen.getByRole('button', { name: '알림 (새 알림 있음)' })).toBeInTheDocument()
  })

  it('읽지 않은 알림이 없으면 새 알림 표시를 하지 않는다', () => {
    renderHome({ home: { ...MOCK_HOME, unreadNotificationCount: 0 } })

    expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument()
  })

  it('탭하면 알림 목록으로 이동을 요청한다', async () => {
    const { user, onNotificationClick } = renderHome()

    await user.click(screen.getByRole('button', { name: /^알림/ }))

    expect(onNotificationClick).toHaveBeenCalledTimes(1)
  })
})

describe('드라이브 정보 배너', () => {
  it.each([
    ['dawn', 'dawn'],
    ['day', 'day'],
    ['evening', 'evening'],
    ['night', 'night'],
  ] as const)('시간대(%s)에 맞는 배경 사진을 보여 준다', (timeOfDay, file) => {
    renderHome({ timeOfDay })

    // 배경 사진은 꾸밈용이라 대체 텍스트가 없다
    expect(banner().querySelector('img')).toHaveAttribute('src', expect.stringContaining(file))
  })

  it('날씨, 교통 상황, 추천 테마를 표시한다', () => {
    renderHome()

    const region = within(banner())
    expect(region.getByText('맑음')).toBeInTheDocument()
    expect(region.getByText('22°')).toBeInTheDocument()
    expect(region.getByText('원활')).toBeInTheDocument()
    expect(region.getByText('바다 드라이브')).toBeInTheDocument()
  })

  it("날씨·교통 정보를 불러오지 못하면 '--'로 표시한다", () => {
    renderHome({
      home: { ...MOCK_HOME, context: { weather: null, temperature: null, traffic: null, recommendedTheme: null } },
    })

    const items = within(banner()).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item).toHaveTextContent('--')
    }
  })

  it('일부 정보만 없으면 그 칸만 --로 표시한다', () => {
    renderHome({
      home: { ...MOCK_HOME, context: { weather: '맑음', temperature: 22, traffic: null, recommendedTheme: '바다 드라이브' } },
    })

    const [weather, traffic, theme] = within(banner()).getAllByRole('listitem')
    expect(weather).toHaveTextContent('22°')
    expect(traffic).toHaveTextContent('--')
    expect(theme).toHaveTextContent('바다 드라이브')
  })

  it('기온이 0도여도 --가 아니라 0°로 표시한다', () => {
    renderHome({ home: { ...MOCK_HOME, context: { ...MOCK_HOME.context, temperature: 0 } } })

    expect(within(banner()).getByText('0°')).toBeInTheDocument()
  })

  it('차량이 연결되어 있으면 연결 완료를 표시한다', () => {
    renderHome({ carConnected: true })

    expect(within(banner()).getByText('차량 연결 완료')).toBeInTheDocument()
  })

  it('차량이 연결되어 있지 않으면 연결 실패를 표시한다', () => {
    renderHome({ carConnected: false })

    expect(within(banner()).getByText('차량 연결 실패')).toBeInTheDocument()
  })

  it('드라이브 시작하기를 탭하면 드라이브 시작을 요청한다', async () => {
    const { user, onStartDrive } = renderHome()

    await user.click(screen.getByRole('button', { name: '드라이브 시작하기' }))

    expect(onStartDrive).toHaveBeenCalledTimes(1)
  })
})

describe('스마트 탐색 & 큐레이션', () => {
  it('카테고리 칩 5개를 표시하고 첫 번째가 선택되어 있다', () => {
    renderHome()

    const chips = ['바다', '야경', '근교 카페', '자연', '차박'].map((name) =>
      within(curation()).getByRole('button', { name }),
    )
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true')
    for (const chip of chips.slice(1)) {
      expect(chip).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('처음에는 선택된 카테고리의 장소만 표시한다', () => {
    renderHome()

    expect(spotNames()).toEqual(['시흥 오이도', '강릉 헌화로', '인천 을왕리 해수욕장'])
  })

  it('칩을 탭하면 그 칩이 강조되고 해당 테마의 장소로 목록이 바뀐다', async () => {
    const { user } = renderHome()

    await user.click(within(curation()).getByRole('button', { name: '근교 카페' }))

    expect(within(curation()).getByRole('button', { name: '근교 카페' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(curation()).getByRole('button', { name: '바다' })).toHaveAttribute('aria-pressed', 'false')
    expect(spotNames()).toEqual(['남양주 북한강 카페거리', '파주 헤이리 예술마을', '양평 서종 카페거리'])
  })

  it.each([
    ['바다', ['시흥 오이도', '강릉 헌화로', '인천 을왕리 해수욕장']],
    ['야경', ['서울 남산 순환도로', '서울 반포한강공원', '인천 송도 센트럴파크']],
    ['근교 카페', ['남양주 북한강 카페거리', '파주 헤이리 예술마을', '양평 서종 카페거리']],
    ['자연', ['양평 두물머리', '가평 청평호반', '포천 산정호수']],
    ['차박', ['태안 몽산포 캠핑장', '가평 자라섬 캠핑장', '포천 백로주 캠핑장']],
  ])('목 데이터: %s 카테고리의 장소 3곳을 사진과 함께 표시한다', async (category, expected) => {
    const { user } = renderHome()

    await user.click(within(curation()).getByRole('button', { name: category }))

    expect(spotNames()).toEqual(expected)
    for (const card of within(curation()).getAllByRole('article')) {
      expect(card.querySelector('img[src^="/mocks/spots/"]')).not.toBeNull()
    }
  })

  it('장소가 없는 카테고리는 안내 문구를 표시한다', async () => {
    const { user } = renderHome({ spots: MOCK_SPOTS.filter((spot) => spot.categoryId !== 5) })

    await user.click(within(curation()).getByRole('button', { name: '차박' }))

    expect(spotNames()).toEqual([])
    expect(within(curation()).getByText('추천 장소를 준비하고 있어요.')).toBeInTheDocument()
  })

  it('장소 카드는 최대 7개까지만 표시한다', () => {
    const spots: SpotSummary[] = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      name: `장소 ${index + 1}`,
      region: '경기 시흥시',
      travelTime: '약 1시간',
      tags: ['바다'],
      categoryId: 1,
      liked: false,
    }))
    renderHome({ spots })

    expect(spotNames()).toEqual(['장소 1', '장소 2', '장소 3', '장소 4', '장소 5', '장소 6', '장소 7'])
  })

  it('장소 카드에 장소명, 위치와 예상 소요 시간, 해시태그를 표시한다', () => {
    renderHome()

    const card = within(curation()).getAllByRole('article')[0]
    expect(within(card).getByRole('heading', { name: '시흥 오이도' })).toBeInTheDocument()
    expect(card).toHaveTextContent('경기 시흥시 · 약 1시간')
    expect(card).toHaveTextContent('#일몰')
    expect(card).toHaveTextContent('#해안도로')
  })

  it('장소 카드를 탭하면 해당 장소의 상세로 이동을 요청한다', async () => {
    const { user, onSpotClick } = renderHome()

    await user.click(within(curation()).getByRole('button', { name: '강릉 헌화로' }))

    expect(onSpotClick).toHaveBeenCalledWith(2)
  })

  it('하트를 탭하면 찜 상태 변경을 요청하고 상세로는 이동하지 않는다', async () => {
    const { user, onLikeToggle, onSpotClick } = renderHome()
    const [liked, notLiked] = within(curation()).getAllByRole('article')

    await user.click(within(liked).getByRole('button', { name: '좋아요 취소' }))
    await user.click(within(notLiked).getByRole('button', { name: '좋아요' }))

    expect(onLikeToggle).toHaveBeenNthCalledWith(1, 1, false)
    expect(onLikeToggle).toHaveBeenNthCalledWith(2, 2, true)
    expect(onSpotClick).not.toHaveBeenCalled()
  })

  it('카테고리가 없어도 화면이 깨지지 않는다', () => {
    renderHome({ categories: [], spots: [] })

    expect(within(curation()).getByText('추천 장소를 준비하고 있어요.')).toBeInTheDocument()
  })
})

describe('하단 네비바', () => {
  it('홈 · 기록 지도 · 마이 탭을 표시하고 홈을 현재 탭으로 강조한다', () => {
    renderHome()

    const nav = within(screen.getByRole('navigation', { name: '메인 메뉴' }))
    expect(nav.getByRole('button', { name: '홈' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('button', { name: '기록 지도' })).not.toHaveAttribute('aria-current')
    expect(nav.getByRole('button', { name: '마이' })).not.toHaveAttribute('aria-current')
  })

  it('다른 탭을 탭하면 해당 탭으로 이동을 요청한다', async () => {
    const { user, onTabChange } = renderHome()
    const nav = within(screen.getByRole('navigation', { name: '메인 메뉴' }))

    await user.click(nav.getByRole('button', { name: '기록 지도' }))
    await user.click(nav.getByRole('button', { name: '마이' }))

    expect(onTabChange).toHaveBeenNthCalledWith(1, 'map')
    expect(onTabChange).toHaveBeenNthCalledWith(2, 'my')
  })
})

// 터치 기기는 브라우저가 가로 스크롤을 처리한다. 마우스(데스크톱·스토리북)는 드래그로 넘길 수 있어야 한다
describe('가로 목록 마우스 드래그', () => {
  const spotList = () => within(curation()).getAllByRole('list')[1]

  it('장소 카드 목록을 마우스로 끌면 끈 만큼 가로로 스크롤된다', async () => {
    const { user } = renderHome()
    const list = spotList()
    const card = within(list).getByRole('button', { name: '강릉 헌화로' })

    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { clientX: 300, clientY: 100 } },
      { target: card, coords: { clientX: 180, clientY: 100 } },
    ])

    expect(list.scrollLeft).toBe(120)
  })

  it('끌어서 넘긴 뒤 손을 떼도 카드가 눌리지 않는다', async () => {
    const { user, onSpotClick } = renderHome()
    const card = within(spotList()).getByRole('button', { name: '강릉 헌화로' })

    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { clientX: 300, clientY: 100 } },
      { target: card, coords: { clientX: 180, clientY: 100 } },
      { keys: '[/MouseLeft]', target: card, coords: { clientX: 180, clientY: 100 } },
    ])

    expect(onSpotClick).not.toHaveBeenCalled()
  })

  it('끌지 않고 누르면 카드가 그대로 눌린다', async () => {
    const { user, onSpotClick } = renderHome()
    const card = within(spotList()).getByRole('button', { name: '강릉 헌화로' })

    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { clientX: 300, clientY: 100 } },
      { target: card, coords: { clientX: 302, clientY: 100 } },
      { keys: '[/MouseLeft]', target: card, coords: { clientX: 302, clientY: 100 } },
    ])

    expect(onSpotClick).toHaveBeenCalledWith(2)
  })

  it('카테고리 칩 목록도 마우스로 끌어서 스크롤할 수 있다', async () => {
    const { user } = renderHome()
    const list = within(curation()).getAllByRole('list')[0]
    const chip = within(list).getByRole('button', { name: '야경' })

    await user.pointer([
      { keys: '[MouseLeft>]', target: chip, coords: { clientX: 200, clientY: 100 } },
      { target: chip, coords: { clientX: 150, clientY: 100 } },
      { keys: '[/MouseLeft]', target: chip, coords: { clientX: 150, clientY: 100 } },
    ])

    expect(list.scrollLeft).toBe(50)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('미작성 드라이브 카드 배너', () => {
  it('24시간 안에 저장하지 않은 카드가 있으면 인사말 아래에 배너를 표시한다', () => {
    renderHome({ pendingCard: { count: 1, driveId: 'drv_01', remainingSeconds: 18 * 3600 } })

    expect(screen.getByRole('button', { name: /미작성 드라이브 카드 1개/ })).toHaveTextContent('남은 시간 18:00:00')
  })

  it('미작성 카드가 없으면 배너를 표시하지 않는다', () => {
    renderHome({ pendingCard: null })

    expect(screen.queryByRole('button', { name: /미작성 드라이브 카드/ })).not.toBeInTheDocument()
  })

  it('배너를 누르면 마감이 가장 빠른 카드를 작성하러 간다', async () => {
    const onPendingCardClick = vi.fn()
    const { user } = renderHome({
      pendingCard: { count: 2, driveId: 'drv_01', remainingSeconds: 60 },
      onPendingCardClick,
    })

    await user.click(screen.getByRole('button', { name: /미작성 드라이브 카드 2개/ }))

    expect(onPendingCardClick).toHaveBeenCalledWith('drv_01')
  })
})
