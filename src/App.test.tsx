import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/auth'
import { prepareDrive } from '@/api/drives'
import {
  MOCK_PARTNER_INVITE_CODE,
  MOCK_RESTORE_INVITE_CODE,
  mockDisconnectCouple,
  mockEndSession,
  mockFetchMe,
  resetMockCouple,
} from '@/mocks/couples'
import { mockFetchFavorites, mockFetchPublicPlace, resetMockPlaces } from '@/mocks/places'
import { resetMockCards } from '@/mocks/cards'
import { mockGetPlaylist, resetMockDjPlaylists } from '@/mocks/djPlaylists'
import { resetMockRadio } from '@/mocks/radio'
import { resetMockGames } from '@/mocks/games'
import { resetMockJobs, setMockGenerateMs } from '@/mocks/jobs'
import { mockGetActiveDrive, resetMockDrives } from '@/mocks/drives'
import { resetMockStamps } from '@/mocks/restAreas'
import { resetMockRoutes } from '@/mocks/routes'
import { resetMockNotifications } from '@/mocks/notifications'
import { resetMockSearchHistory } from '@/mocks/search'
import { resetMockRecordDeletions } from './mocks/records'
import App from './App'
import type { ApiResponse } from './types/api'
import type { RecordCalendar, RecordMapMarker } from './types/record'

vi.mock('./components/DriveMap/DriveMap', () => ({ default: () => <div data-testid="drive-map" /> }))

// 카카오 지도 SDK는 jsdom에서 동작하지 않으므로 마커 버튼만 그리는 가짜 지도로 바꾼다
vi.mock('./pages/RecordMap/RecordMapView', async () => {
  const { default: RecordMarker } = await import('./pages/RecordMap/RecordMarker')
  return {
    default: ({ markers, onMarkerClick }: { markers: RecordMapMarker[]; onMarkerClick: (marker: RecordMapMarker) => void }) => (
      <div data-testid="map">
        {markers.map((marker) => (
          <RecordMarker key={marker.groupKey} marker={marker} onClick={onMarkerClick} />
        ))}
      </div>
    ),
  }
})

// 목 데이터에는 같은 날짜에 기록이 여러 개인 날이 없어, 필요한 테스트에서만 달력 응답(날짜별 기록 수)을 바꿔 끼운다
const calendarOverride = vi.hoisted(() => ({ current: null as ((month: string) => Promise<ApiResponse<RecordCalendar>>) | null }))
vi.mock('./api/records', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/records')>()
  return {
    ...actual,
    fetchRecordCalendar: (month: string) => calendarOverride.current?.(month) ?? actual.fetchRecordCalendar(month),
  }
})

// 목 서버에서 지운 기록이 다른 테스트에 남지 않게 한다
afterEach(() => {
  resetMockRecordDeletions()
  calendarOverride.current = null
})

// 백엔드 주소가 없는 테스트 환경에서는 목 데이터로 응답한다
function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

// 홈에 들어오면 미작성 카드 팝업이 먼저 뜬다. '나중에'로 닫은 뒤 드라이브를 시작한다
async function startDriveFromHome(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '나중에' }))
  await user.click(screen.getByRole('button', { name: '드라이브 시작하기' }))
}

beforeEach(() => {
  resetMockCouple()
  resetMockDrives()
  resetMockStamps()
  resetMockDjPlaylists()
  resetMockJobs()
  resetMockRadio()
  resetMockGames()
  resetMockPlaces()
  localStorage.clear()
  sessionStorage.clear()
  resetMockCards()
  resetMockNotifications()
})

describe('홈 ↔ 알림 화면 이동', () => {
  it('홈의 알림 버튼 → 알림 목록 → 알림을 탭하면 읽음 처리되고, 홈으로 돌아오면 새 알림 표시가 사라진다', async () => {
    const user = renderApp()

    await user.click(await screen.findByRole('button', { name: '알림 (새 알림 있음)' }))

    expect(screen.getByRole('heading', { level: 1, name: '알림' })).toBeInTheDocument()
    const unread = await screen.findByRole('button', { name: /민지님이 드라이브 장소를 공유했어요/ })
    expect(unread).toHaveTextContent('읽지 않음')

    // 공유받은 장소 알림이라 탭하면 장소 상세로 이동한다
    await user.click(unread)
    await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })

    // 상세 → 알림 목록: 방금 탭한 알림이 읽음으로 바뀌어 있다
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /민지님이 드라이브 장소를 공유했어요/ })).not.toHaveTextContent(
      '읽지 않음',
    )

    // 알림 목록 → 홈: 종 아이콘의 새 알림 표시가 없다
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
    expect(await screen.findByRole('button', { name: '알림' })).toBeInTheDocument()
  })

  it('알림 주소로 바로 들어와서 뒤로가기를 누르면 홈으로 간다', async () => {
    const user = renderApp('/notifications')

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })
})

describe('홈 · 알림 → 장소 상세 이동', () => {
  it('홈의 장소 카드를 탭하면 그 장소의 상세 화면으로 이동하고, 뒤로가면 홈으로 돌아온다', async () => {
    const user = renderApp()

    // 추천 장소는 GET /places/recommendations 로 불러온다
    await user.click(await screen.findByRole('button', { name: '강릉 헌화로' }))

    expect(await screen.findByRole('heading', { level: 1, name: '강릉 헌화로' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it('상세에서 찜하면 홈으로 돌아왔을 때 카드의 하트에도 반영된다', async () => {
    const user = renderApp()
    await user.click(await screen.findByRole('button', { name: '강릉 헌화로' }))
    await screen.findByRole('heading', { level: 1, name: '강릉 헌화로' })

    await user.click(screen.getByRole('button', { name: '좋아요' }))
    expect(await screen.findByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    const card = screen.getByRole('button', { name: '강릉 헌화로' }).closest('article')
    expect(card).not.toBeNull()
    expect(card!.querySelector('button[aria-pressed="true"]')).not.toBeNull()
  })

  it('홈 카드의 하트를 누르면 찜이 저장되어 상세 화면에도 찜으로 보인다', async () => {
    const user = renderApp()
    const card = (await screen.findByRole('button', { name: '강릉 헌화로' })).closest('article')!

    await user.click(within(card).getByRole('button', { name: '좋아요' }))
    await user.click(within(card).getByRole('button', { name: '강릉 헌화로' }))

    await screen.findByRole('heading', { level: 1, name: '강릉 헌화로' })
    expect(await screen.findByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
  })

  it('공유받은 장소 알림을 탭하면 그 장소의 상세 화면으로 이동한다', async () => {
    const user = renderApp('/notifications')

    await user.click(await screen.findByRole('button', { name: /드라이브 장소를 공유했어요/ }))

    expect(await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()
  })

  it('연인이 소감을 남긴 알림을 탭하면 그 카드의 기록 상세로 이동한다', async () => {
    const user = renderApp('/notifications')

    await user.click(await screen.findByRole('button', { name: /드라이브 소감을 남겼어요/ }))

    expect(await screen.findByRole('button', { name: '카드 삭제' })).toBeInTheDocument()
  })

  it('연인에게 보내기 → 보내기 → 전송 완료 안내까지 이어진다', async () => {
    const user = renderApp('/places/plc_oido')
    await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })

    await user.click(screen.getByRole('button', { name: '연인에게 보내기' }))
    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(await screen.findByRole('dialog', { name: '드라이브 코스 전송 완료!' })).toHaveTextContent(
      '민지님에게 드라이브 코스를 보냈어요.',
    )
  })

  it('없는 장소 주소로 들어오면 불러오지 못했다는 안내를 표시한다', async () => {
    renderApp('/places/999')

    expect(await screen.findByRole('alert')).toHaveTextContent('장소 정보를 불러오지 못했어요.')
  })
})

describe('마이 화면', () => {
  it('하단 마이 탭을 누르면 마이 화면으로 이동하고, 커플 요약을 표시한다', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('button', { name: '마이' }))

    expect(await screen.findByRole('button', { name: /누적 330km · D\+23/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: '홈' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it.each([
    ['개인정보 처리 방침', '개인정보 처리방침', '제1조 개인정보의 수집 항목 및 방법'],
    ['이용 약관', '이용 약관', '제1조 목적'],
    ['오픈소스 라이선스', '오픈소스 라이선스', 'React Router'],
  ])("'%s'를 누르면 문서 화면으로 이동하고, 뒤로가면 마이 화면으로 돌아온다", async (menu, title, text) => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: menu }))

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(await screen.findByText(text)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /누적 330km/ })).toBeInTheDocument()
  })

  it("'자주 묻는 질문 (FAQ)'를 누르면 FAQ 화면으로 이동해 답변을 펼쳐 볼 수 있고, 뒤로가면 마이 화면으로 돌아온다", async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: '자주 묻는 질문 (FAQ)' }))

    expect(screen.getByRole('heading', { level: 1, name: '자주 묻는 질문' })).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '연인과 어떻게 연결하나요?' }))
    expect(screen.getByText(/연인 초대 화면에서 코드를 주고받으면/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /누적 330km/ })).toBeInTheDocument()
  })

  it('로그아웃 → 확인하면 로그인 화면으로 이동한다', async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))
    await user.click(screen.getAllByRole('button', { name: '로그아웃' }).at(-1)!)

    expect(await screen.findByRole('heading', { level: 1, name: '붕붕어스' })).toBeInTheDocument()
  })
})

describe('커플 페이지', () => {
  it('마이 화면의 프로필 카드를 누르면 커플 페이지로 이동하고, 뒤로가면 돌아온다', async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: /누적 330km/ }))

    expect(screen.getByRole('heading', { level: 1, name: '커플 페이지' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /우리의 시작/ })).toHaveTextContent('2026.10.20')

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /누적 330km/ })).toBeInTheDocument()
  })

  it('붕붕이명을 바꾸면 마이 화면에도 반영된다', async () => {
    const user = renderApp('/my/couple')

    await user.click(await screen.findByRole('button', { name: /이름 변경하기/ }))
    const input = screen.getByRole('textbox', { name: '붕붕이명' })
    await user.clear(input)
    await user.type(input, '씽씽이')
    await user.click(screen.getByRole('button', { name: '저장하기' }))
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByRole('button', { name: /씽씽이/ })).toBeInTheDocument()
  })

  it('커플 연결을 해제하면 마이 화면으로 돌아가 연결 안내를 표시한다', async () => {
    const user = renderApp('/my/couple')

    await user.click(await screen.findByRole('button', { name: /커플 연결 끊기/ }))
    await user.click(screen.getByRole('button', { name: '연결 해제' }))

    expect(await screen.findByRole('button', { name: /연인과 연결해 보세요/ })).toBeInTheDocument()
  })
})

describe('보관함', () => {
  it('찜한 드라이브 코스: 카드를 누르면 장소 상세로 가고, 뒤로가면 보관함으로 돌아온다', async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: '찜한 드라이브 코스' }))
    expect(screen.getByRole('heading', { level: 1, name: '찜한 드라이브 코스' })).toBeInTheDocument()
    // 첫 화면은 바다 칩이 골라진 상태로 연다
    expect(screen.getByRole('button', { name: '바다' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(await screen.findByRole('button', { name: '시흥 오이도' }))
    expect(await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('heading', { level: 1, name: '찜한 드라이브 코스' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /누적 330km/ })).toBeInTheDocument()
  })

  it('찜한 드라이브 코스: 카테고리 칩으로 거르고, 찜을 취소하면 홈 카드의 하트에도 반영된다', async () => {
    const user = renderApp('/')
    await user.click(screen.getByRole('button', { name: '마이' }))
    await user.click(await screen.findByRole('button', { name: '찜한 드라이브 코스' }))

    await user.click(screen.getByRole('button', { name: '야경' }))
    const card = await screen.findByRole('article', { name: '서울 남산 순환도로' })
    expect(screen.queryByRole('article', { name: '시흥 오이도' })).not.toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: '좋아요 취소' }))
    expect(within(card).getByRole('button', { name: '좋아요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(await screen.findByRole('button', { name: '홈' }))
    await user.click(screen.getByRole('button', { name: '야경' }))
    const homeCard = screen.getByRole('button', { name: '서울 남산 순환도로' }).closest('article')
    expect(homeCard!.querySelector('button[aria-pressed="false"]')).not.toBeNull()
  })

  it('플레이리스트 보관함: 저장한 플레이리스트와 개수를 보여 준다', async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: '플레이리스트 보관함' }))

    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('내가 저장한 플레이리스트 4개')
    expect(screen.getByRole('button', { name: /노을처럼 따뜻한 우리/ })).toBeInTheDocument()
  })

  it('라디오 사연 보관함: 검색어를 입력하면 맞는 사연만 남는다', async () => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: '라디오 사연 보관함' }))
    const list = await screen.findByRole('list', { name: '보낸 사연' })
    expect(within(list).getAllByRole('button')).toHaveLength(10)

    await user.type(screen.getByRole('searchbox', { name: '사연 검색' }), '휴게소')

    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: '보낸 사연' })).getAllByRole('button')).toHaveLength(1),
    )
    expect(screen.getByRole('button', { name: /^배가 너무 고파서/ })).toBeInTheDocument()
  })

  it('라디오 사연 보관함: 사연을 누르면 방송 문구 상세로 가고, 뒤로가면 보관함으로 돌아온다', async () => {
    const user = renderApp('/my/stories')

    await user.click(await screen.findByRole('button', { name: /^오늘 날씨가 너무 좋아서/ }))

    expect(screen.getByRole('heading', { level: 1, name: '라디오' })).toBeInTheDocument()
    expect(await screen.findByText(/붕붕이 DJ입니다/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('heading', { level: 1, name: '라디오 사연 보관함' })).toBeInTheDocument()
  })

  it('없는 사연 주소로 들어오면 볼 수 없는 사연이라고 안내한다', async () => {
    renderApp('/my/stories/rad_none')

    expect(await screen.findByRole('alert')).toHaveTextContent('삭제되었거나 볼 수 없는 사연이에요.')
  })
})

describe('연인 초대', () => {
  it('연결을 끊은 뒤 마이 화면의 프로필 카드를 누르면 연인 초대 화면으로 가고, 연인 코드로 연결하면 홈으로 간다', async () => {
    const user = renderApp('/my/couple')
    await user.click(await screen.findByRole('button', { name: /커플 연결 끊기/ }))
    await user.click(screen.getByRole('button', { name: '연결 해제' }))

    await user.click(await screen.findByRole('button', { name: /연인과 연결해 보세요/ }))
    expect(screen.getByRole('heading', { level: 1, name: '연인 초대' })).toBeInTheDocument()
    const myCode = within(screen.getByRole('region', { name: '나의 코드' }))
    await waitFor(() => expect(myCode.getByRole('button', { name: '내 코드 복사' })).toBeEnabled())

    await user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), MOCK_PARTNER_INVITE_CODE)
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '마이' }))
    expect(await screen.findByRole('button', { name: /누적 0km · D\+1/ })).toBeInTheDocument()
  })

  it('예전에 연결했던 연인의 코드를 입력하면 다시 연결할지 묻고, 다시 연결하면 예전 기록으로 홈에 간다', async () => {
    const user = renderApp('/my/couple')
    await user.click(await screen.findByRole('button', { name: /커플 연결 끊기/ }))
    await user.click(screen.getByRole('button', { name: '연결 해제' }))
    await user.click(await screen.findByRole('button', { name: /연인과 연결해 보세요/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: '내 코드 복사' })).toBeEnabled())

    await user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), MOCK_RESTORE_INVITE_CODE)
    await user.click(screen.getByRole('button', { name: '완료' }))
    const sheet = within(await screen.findByRole('dialog', { name: '예전에 연결했던 연인이에요' }))
    await user.click(sheet.getByRole('button', { name: '다시 연결하기' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '마이' }))
    expect(await screen.findByRole('button', { name: /누적 330km · D\+23/ })).toBeInTheDocument()
  })

  it('건너뛰기를 누르면 연결하지 않고 홈으로 간다', async () => {
    const user = renderApp('/couple/invite')

    await user.click(await screen.findByRole('button', { name: '건너뛰기' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
  })
})

describe('로그인 · 가입 (기능명세서 L1~L9)', () => {
  // 로그아웃한 기기: 목 서버는 다음 로그인을 아직 가입하지 않은 새 사용자로 응답한다
  async function signOut() {
    await logout('test-logout')
  }

  // 목 장소 id는 브랜치마다 다를 수 있어 목 저장소에서 꺼내 쓴다
  async function firstMockPlaceId() {
    const { data } = await mockFetchFavorites()
    return data.items[0].id
  }

  it('로그인하지 않았으면 어느 주소로 들어와도 로그인 화면을 보여 준다', async () => {
    await signOut()
    renderApp('/my')

    expect(await screen.findByRole('heading', { level: 1, name: '붕붕어스' })).toBeInTheDocument()
  })

  it('새 가입자: 로그인 → 약관 동의 → 이름 · 생일 · 성별 · 만난 날(건너뛰기) · 붕붕이 이름 → 연인 초대 → 건너뛰면 메인 홈', async () => {
    await signOut()
    const user = renderApp('/')

    await user.click(await screen.findByRole('button', { name: '카카오로 3초 만에 시작하기' }))

    // L2 환영 · 약관 동의
    await user.click(await screen.findByRole('checkbox', { name: /이용약관 및 개인정보 처리방침에 동의해요/ }))
    await user.click(screen.getByRole('button', { name: '만나서 반가워!' }))

    // L3 → L4 닉네임
    await user.click(await screen.findByRole('button', { name: '나는...' }))
    await user.type(await screen.findByRole('textbox', { name: '닉네임' }), '현우')
    await user.click(screen.getByRole('button', { name: '다음' }))

    // L5 생일
    await user.type(await screen.findByRole('textbox', { name: '생일' }), '20020304')
    await user.click(screen.getByRole('button', { name: '다음' }))

    // L6 성별
    await user.click(await screen.findByRole('radio', { name: '남자' }))
    await user.click(screen.getByRole('button', { name: '다음' }))

    // L7 만난 날 — 건너뛰기
    expect(await screen.findByRole('heading', { level: 2, name: '연인과 언제부터 만났나요?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    // L8 붕붕이 이름 → 저장
    await user.type(await screen.findByRole('textbox', { name: '붕붕이 이름' }), '쌩쌩이')
    await user.click(screen.getByRole('button', { name: '다음' }))

    // L9 연인 초대 → 건너뛰기 → 메인 홈
    expect(await screen.findByRole('heading', { level: 1, name: '연인 초대' })).toBeInTheDocument()
    expect((await mockFetchMe()).data).toMatchObject({
      nickname: '현우',
      birthDate: '2002-03-04',
      gender: 'MALE',
      onboardingCompleted: true,
    })
    await user.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
  })

  it('가입 질문에서 뒤로가기를 누르면 이전 질문으로 돌아가고, 입력한 답이 남아 있다', async () => {
    await signOut()
    const user = renderApp('/login')

    await user.click(await screen.findByRole('button', { name: '카카오로 3초 만에 시작하기' }))
    await user.click(await screen.findByRole('checkbox', { name: /동의해요/ }))
    await user.click(screen.getByRole('button', { name: '만나서 반가워!' }))
    await user.click(await screen.findByRole('button', { name: '나는...' }))
    await user.type(await screen.findByRole('textbox', { name: '닉네임' }), '현우')
    await user.click(screen.getByRole('button', { name: '다음' }))

    await user.click(await screen.findByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('textbox', { name: '닉네임' })).toHaveValue('현우')
  })

  it('가입을 마치지 않은 사용자는 다른 화면 주소로 들어와도 가입 화면으로 간다', async () => {
    await signOut()
    const user = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: '카카오로 3초 만에 시작하기' }))
    await screen.findByRole('button', { name: '만나서 반가워!' })

    await user.click(screen.getByRole('button', { name: '이용약관 보기' }))
    expect(await screen.findByRole('heading', { level: 1, name: '이용 약관' })).toBeInTheDocument()
  })

  it('로그인하지 않았어도 장소 공유 링크를 열면 로그인 화면 대신 공개 장소 화면을 보여 준다', async () => {
    const { data: place } = await mockFetchPublicPlace(await firstMockPlaceId())
    await signOut()
    const user = renderApp(`/places/${place.id}`)

    expect(await screen.findByRole('heading', { level: 1, name: place.name })).toBeInTheDocument()
    expect(screen.getByText('공유받은 드라이브 장소')).toBeInTheDocument()
    // 로그인이 필요한 회원용 버튼은 없다
    expect(screen.queryByRole('button', { name: '연인에게 보내기' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '붕붕어스 시작하기' }))
    expect(await screen.findByRole('button', { name: '카카오로 3초 만에 시작하기' })).toBeInTheDocument()
  })

  it('로그인하지 않은 사용자가 없는 장소 링크를 열면 찾을 수 없다고 안내한다', async () => {
    await signOut()
    renderApp('/places/없는-장소')

    expect(await screen.findByRole('alert')).toHaveTextContent('장소를 찾을 수 없어요.')
  })

  it('로그인한 사용자가 장소 공유 링크를 열면 기존 회원용 상세를 보여 준다', async () => {
    const placeId = await firstMockPlaceId()
    renderApp(`/places/${placeId}`)

    expect(await screen.findByRole('button', { name: '연인에게 보내기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '붕붕어스 시작하기' })).not.toBeInTheDocument()
  })

  it('기존 가입자는 로그인하면 바로 메인 홈으로 간다', async () => {
    mockEndSession() // 가입을 마친 민준의 세션만 끊긴 기기
    const user = renderApp('/login')

    await user.click(await screen.findByRole('button', { name: '카카오로 3초 만에 시작하기' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
  })
})

describe('홈 ↔ 기록 지도 이동', () => {
  it('하단 네비바의 기록 지도 탭을 누르면 함께한 드라이브 횟수가 보이고, 홈 탭으로 돌아올 수 있다', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('button', { name: '기록 지도' }))

    expect(screen.getByRole('heading', { level: 1, name: '우리 어디까지 가봤지?' })).toBeInTheDocument()
    expect(await screen.findByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '홈' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it('목록형으로 바꾸면 최신순 기록 목록을 보여주고, 검색하면 맞는 기록만 남는다 (전체 횟수는 그대로)', async () => {
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')

    await user.click(screen.getByRole('button', { name: '목록형' }))
    const list = await screen.findByRole('list', { name: '드라이브 기록 목록' })
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('자라섬 캠핑 드라이브')

    await user.type(screen.getByRole('searchbox', { name: '기록 검색' }), '오이도{Enter}')

    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')).toHaveLength(2),
    )
    expect(screen.getByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()
  })

  it('캘린더에서 날짜를 고르면 그날의 기록만 남고, 검색창에 날짜가 보인다', async () => {
    // 달력은 서울 기준 오늘이 있는 달(2026년 11월)부터 띄운다
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-13T03:00:00Z'))
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')
    await user.click(screen.getByRole('button', { name: '목록형' }))
    await screen.findByRole('list', { name: '드라이브 기록 목록' })

    await user.click(screen.getByRole('button', { name: '날짜로 검색' }))
    const calendar = screen.getByRole('dialog', { name: '날짜로 기록 검색' })
    expect(within(calendar).getByRole('heading', { name: '2026년 11월' })).toBeInTheDocument()
    await user.click(within(calendar).getByRole('button', { name: '이전 달' }))
    await user.click(await within(calendar).findByRole('button', { name: '2026년 10월 24일' }))

    expect(screen.queryByRole('dialog', { name: '날짜로 기록 검색' })).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: '기록 검색' })).toHaveValue('2026년 10월 24일')
    await waitFor(() => {
      const items = within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('몽산포 해변 산책')
    })

    // 검색창의 X를 누르면 전체 기록으로 돌아간다
    await user.click(screen.getByRole('button', { name: '날짜 검색 해제' }))
    expect(screen.getByRole('searchbox', { name: '기록 검색' })).toHaveValue('')
    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem').length).toBeGreaterThan(1),
    )
    expect(screen.queryByRole('button', { name: '날짜 검색 해제' })).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  // 기능명세서 9️⃣: 날짜를 고르면 기록 지도(날짜 필터)로 가고, 같은 날짜에 기록이 여러 개일 때만 목록형으로 나열한다
  describe('지도형에서 날짜를 고를 때', () => {
    async function pickOctober24(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: '날짜로 검색' }))
      const calendar = screen.getByRole('dialog', { name: '날짜로 기록 검색' })
      await user.click(within(calendar).getByRole('button', { name: '이전 달' }))
      await user.click(await within(calendar).findByRole('button', { name: '2026년 10월 24일' }))
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-13T03:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('그날 기록이 하나면 지도형을 그대로 둔다', async () => {
      const user = renderApp('/map')
      await screen.findByText('총 12번의 드라이브를 함께했어요')

      await pickOctober24(user)

      expect(screen.getByRole('button', { name: '지도형' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('map')).toBeInTheDocument()
    })

    it('그날 기록이 여러 개면 목록형으로 바꿔 나열한다', async () => {
      calendarOverride.current = async (month) => ({
        data: { month, days: [{ date: '2026-10-24', count: 2 }] },
        meta: { requestId: 'req_test', serverTime: '2026-11-13T03:00:00Z' },
      })
      const user = renderApp('/map')
      await screen.findByText('총 12번의 드라이브를 함께했어요')

      await pickOctober24(user)

      expect(screen.getByRole('button', { name: '목록형' })).toHaveAttribute('aria-pressed', 'true')
      expect(await screen.findByRole('list', { name: '드라이브 기록 목록' })).toBeInTheDocument()
    })
  })
})

describe('기록 지도 → 기록 상세', () => {
  it('목록의 기록을 누르면 상세로 이동하고, 삭제하면 목록으로 돌아와 그 기록이 사라진다', async () => {
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')
    await user.click(screen.getByRole('button', { name: '목록형' }))
    const list = await screen.findByRole('list', { name: '드라이브 기록 목록' })

    await user.click(within(list).getByRole('button', { name: /자라섬 캠핑 드라이브/ }))
    expect(await screen.findByRole('heading', { name: '2026년 11월 8일' })).toBeInTheDocument()
    expect(screen.getByText('가평 자라섬')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '카드 삭제' }))
    await user.click(screen.getByRole('button', { name: '삭제하기' }))

    expect(await screen.findByText('총 11번의 드라이브를 함께했어요')).toBeInTheDocument()
    expect(screen.queryByText('자라섬 캠핑 드라이브')).not.toBeInTheDocument()
  })

  it('상세에서 돌아오면 보던 목록형 화면과 검색어가 그대로 남아 있다', async () => {
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')
    await user.click(screen.getByRole('button', { name: '목록형' }))
    await user.type(screen.getByRole('searchbox', { name: '기록 검색' }), '오이도{Enter}')
    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')).toHaveLength(2),
    )

    await user.click(screen.getByRole('button', { name: /오이도 노을 보러/ }))
    await screen.findByRole('heading', { name: '2026년 11월 2일' })
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByRole('button', { name: '목록형' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('searchbox', { name: '기록 검색' })).toHaveValue('오이도')
    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')).toHaveLength(2),
    )
  })

  it('상세에서 돌아오면 고른 날짜 검색이 그대로 남아 있다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-13T03:00:00Z'))
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')
    await user.click(screen.getByRole('button', { name: '목록형' }))
    await user.click(screen.getByRole('button', { name: '날짜로 검색' }))
    const calendar = screen.getByRole('dialog', { name: '날짜로 기록 검색' })
    await user.click(within(calendar).getByRole('button', { name: '이전 달' }))
    await user.click(await within(calendar).findByRole('button', { name: '2026년 10월 24일' }))

    await user.click(await screen.findByRole('button', { name: /몽산포 해변 산책/ }))
    await screen.findByRole('heading', { name: '2026년 10월 24일' })
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByRole('searchbox', { name: '기록 검색' })).toHaveValue('2026년 10월 24일')
    await waitFor(() => {
      const items = within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('몽산포 해변 산책')
    })
    vi.useRealTimers()
  })

  // 기능명세서 🔟: 뒤로가기는 기록 지도로 간다. 공유 링크처럼 주소로 바로 열었을 때도 홈이 아니라 기록 지도로 간다
  it('기록 주소로 바로 들어와서 뒤로가기를 누르면 기록 지도로 간다', async () => {
    const user = renderApp('/cards/crd_01')
    await screen.findByRole('heading', { name: '2026년 11월 8일' })

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByRole('heading', { level: 1, name: '우리 어디까지 가봤지?' })).toBeInTheDocument()
  })

  it('없는 기록 주소로 들어오면 볼 수 없는 기록이라고 안내한다', async () => {
    renderApp('/cards/crd_none')

    expect(await screen.findByRole('alert')).toHaveTextContent('삭제되었거나 볼 수 없는 기록이에요')
  })

  // 기능명세서 18: 도착 후 24시간 안에는 카드를 작성 · 수정할 수 있다 → 상세 대신 작성 화면을 연다
  it('수정 기간 안의 기록을 열면 카드 작성 화면으로 이동한다', async () => {
    renderApp('/cards/crd_writing')

    expect(await screen.findByRole('heading', { level: 1, name: '2026년 11월 3일' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '내 한 줄 소감' })).toBeInTheDocument()
  })

  it('작성 화면에서 나가면 기록 상세를 거치지 않고 이전 화면으로 돌아간다', async () => {
    render(
      <MemoryRouter initialEntries={['/map', '/cards/crd_writing']}>
        <App />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await screen.findByRole('textbox', { name: '내 한 줄 소감' })

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(screen.getByRole('button', { name: '나가기' }))

    expect(await screen.findByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()
  })
})

describe('기록 지도 → 기록 공유', () => {
  it('미리보기 카드의 공유 버튼을 누르면 커플 전용 링크가 담긴 공유 시트가 뜨고, 링크를 복사할 수 있다', async () => {
    const user = renderApp('/map')

    await user.click(await screen.findByRole('button', { name: '자라섬 캠핑 드라이브 기록 보기' }))
    await user.click(screen.getByRole('button', { name: '공유하기' }))

    const sheet = screen.getByRole('dialog', { name: '드라이브 기록 카드 공유하기' })
    expect(await within(sheet).findByText('https://bunbungus.app/cards/crd_01')).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: '링크 복사' }))
    // userEvent가 클립보드를 대신하므로 복사된 내용을 읽어 확인한다
    expect(await navigator.clipboard.readText()).toBe('https://bunbungus.app/cards/crd_01')
    expect(await screen.findByText('링크를 복사했어요.')).toBeInTheDocument()
  })
})

describe('드라이브 모드 진입', () => {
  beforeEach(() => resetMockDrives())

  it('홈의 드라이브 시작하기 → 드라이브명 시트 → 출발하면 드라이브 모드로 이동한다', async () => {
    const user = renderApp()

    await startDriveFromHome(user)
    const sheet = await screen.findByRole('dialog', { name: '드라이브 준비 완료!' })

    await user.type(within(sheet).getByRole('textbox', { name: '드라이브명' }), '우리의 첫 바다 드라이브')
    await user.click(within(sheet).getByRole('button', { name: '붕붕! 붕붕이가 출발' }))

    expect(await screen.findByRole('button', { name: '경로 탐색' })).toBeInTheDocument()
    const { data } = await mockGetActiveDrive()
    expect(data.drive).toMatchObject({
      coupleId: 'cpl_01',
      driverUserId: 'usr_minjun',
      passengerUserId: 'usr_minji',
      recorderUserId: 'usr_minjun',
    })
  })

  it('시트 바깥을 누르면 드라이브를 만들지 않고 시트가 닫힌다', async () => {
    const user = renderApp()

    await startDriveFromHome(user)
    const sheet = await screen.findByRole('dialog', { name: '드라이브 준비 완료!' })
    await user.click(sheet.parentElement!)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it('진행 중인 드라이브가 있으면 시트 없이 바로 드라이브 모드로 이어간다', async () => {
    const members = { driverUserId: 'usr_me', passengerUserId: 'usr_partner', recorderUserId: 'usr_me' }
    await prepareDrive(members, { coupleId: 'cpl_01', idempotencyKey: 'test-idempotency-key-0001' })
    const user = renderApp()

    await startDriveFromHome(user)

    expect(await screen.findByRole('button', { name: '경로 탐색' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('연인과 연결돼 있지 않으면 드라이브 시작하기가 연인 초대 화면으로 보낸다', async () => {
    await mockDisconnectCouple()
    const user = renderApp()

    await user.click(await screen.findByRole('button', { name: '드라이브 시작하기' }))

    expect(await screen.findByRole('heading', { level: 1, name: '연인 초대' })).toBeInTheDocument()
  })

  it('장소 상세의 드라이브 시작하기에서도 드라이브명 시트가 열린다', async () => {
    const user = renderApp('/places/plc_oido')
    await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })

    await user.click(screen.getByRole('button', { name: '드라이브 시작하기' }))

    expect(await screen.findByRole('dialog', { name: '드라이브 준비 완료!' })).toBeInTheDocument()
  })
})

describe('드라이브 모드 첫 진입 화면', () => {
  beforeEach(() => resetMockDrives())

  async function enterDrive(title = '') {
    const user = renderApp()
    await startDriveFromHome(user)
    const sheet = await screen.findByRole('dialog', { name: '드라이브 준비 완료!' })
    if (title) await user.type(within(sheet).getByRole('textbox', { name: '드라이브명' }), title)
    await user.click(within(sheet).getByRole('button', { name: '붕붕! 붕붕이가 출발' }))
    return user
  }

  it('입력한 드라이브명과 출발 전 정보를 보여준다', async () => {
    await enterDrive('우리의 첫 바다 드라이브')

    expect(await screen.findByRole('button', { name: '우리의 첫 바다 드라이브, 드라이브명 수정' })).toBeInTheDocument()
    expect(screen.getByText('-분 -초')).toBeInTheDocument()
    expect(screen.getByText('-km')).toBeInTheDocument()
    expect(screen.getByText('-시 -분')).toBeInTheDocument()
  })

  it('드라이브명을 누르면 수정 시트가 열리고, 수정하면 바로 반영된다', async () => {
    const user = await enterDrive('우리의 첫 바다 드라이브')
    await user.click(await screen.findByRole('button', { name: /드라이브명 수정$/ }))

    const sheet = await screen.findByRole('dialog', { name: '드라이브명 수정하기' })
    const input = within(sheet).getByRole('textbox', { name: '드라이브명' })
    await user.clear(input)
    await user.type(input, '노을 보러 가는 길')
    await user.click(within(sheet).getByRole('button', { name: '수정 완료' }))

    expect(await screen.findByRole('button', { name: '노을 보러 가는 길, 드라이브명 수정' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('경로 탐색 버튼을 누르면 경로 설정 화면으로 이동한다', async () => {
    const user = await enterDrive()
    await user.click(await screen.findByRole('button', { name: '경로 탐색' }))

    expect(await screen.findByRole('heading', { level: 1, name: '경로 설정' })).toBeInTheDocument()
  })

  it('진행 중인 드라이브 없이 /drive 로 들어오면 홈으로 돌아간다', async () => {
    renderApp('/drive')

    expect(await screen.findByText('오늘은 어디로 떠나볼까요?')).toBeInTheDocument()
  })
})

describe('경로 설정', () => {
  beforeEach(() => {
    resetMockDrives()
    resetMockRoutes()
    resetMockSearchHistory()
  })

  async function openRouteSetting() {
    const user = renderApp()
    await startDriveFromHome(user)
    await user.click(await screen.findByRole('button', { name: '붕붕! 붕붕이가 출발' }))
    await user.click(await screen.findByRole('button', { name: '경로 탐색' }))
    await screen.findByRole('heading', { level: 1, name: '경로 설정' })
    return user
  }

  it('처음에는 출발지(내 위치)와 최근 검색을 보여주고, 최근 검색어를 지울 수 있다', async () => {
    const user = await openRouteSetting()

    expect(await screen.findByText('(서초구 서초동)')).toBeInTheDocument()
    const recent = await screen.findByRole('list', { name: '최근 검색' })
    expect(within(recent).getAllByRole('listitem')).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: '강릉 헌화로 최근 검색어 삭제' }))
    expect(within(recent).getAllByRole('listitem')).toHaveLength(4)
  })

  it('검색 → 결과 선택 → 경로 미리보기 → 경로 설정하기를 누르면 드라이브 화면에 도착 예정 시간이 생긴다', async () => {
    const user = await openRouteSetting()

    await user.type(screen.getByRole('textbox', { name: '도착지' }), '한강 공원')
    const results = await screen.findByRole('list', { name: '검색 결과' })
    expect(within(results).getAllByRole('listitem')).toHaveLength(6)

    await user.click(within(results).getByRole('button', { name: /서울 반포 한강공원/ }))
    expect(await screen.findByText('예상 주행 시간')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '경로 설정하기' }))
    await screen.findByRole('button', { name: '경로 탐색' })
    await waitFor(() => expect(screen.queryByText('-시 -분')).not.toBeInTheDocument())
  })

  it('검색 결과가 없으면 안내를 보여준다', async () => {
    const user = await openRouteSetting()

    await user.type(screen.getByRole('textbox', { name: '도착지' }), '없는장소')

    expect(await screen.findByText('검색 결과가 없어요.')).toBeInTheDocument()
  })

  it('닫기를 누르면 드라이브 화면으로 돌아간다', async () => {
    const user = await openRouteSetting()

    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(await screen.findByRole('button', { name: '경로 탐색' })).toBeInTheDocument()
  })
})

describe('드라이브 주행 · 마치기', () => {
  beforeEach(() => {
    resetMockDrives()
    resetMockRoutes()
    resetMockSearchHistory()
  })

  async function startDriving() {
    const user = renderApp()
    await startDriveFromHome(user)
    await user.click(await screen.findByRole('button', { name: '붕붕! 붕붕이가 출발' }))
    await user.click(await screen.findByRole('button', { name: '경로 탐색' }))
    await user.type(await screen.findByRole('textbox', { name: '도착지' }), '한강 공원')
    const results = await screen.findByRole('list', { name: '검색 결과' })
    await user.click(within(results).getByRole('button', { name: /서울 반포 한강공원/ }))
    await user.click(await screen.findByRole('button', { name: '경로 설정하기' }))
    await screen.findByRole('button', { name: '드라이브 마치기' })
    return user
  }

  it('일시정지하면 기록 중단 안내가 뜨고, 화면을 누르면 주행을 재개한다', async () => {
    const user = await startDriving()
    expect(screen.queryByText('-분 -초')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '주행 기록 일시정지' }))
    expect(await screen.findByText('기록이 중단되었어요.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /주행 재개/ }))
    await waitFor(() => expect(screen.queryByText('기록이 중단되었어요.')).not.toBeInTheDocument())
  })

  it('일시정지 중에는 같은 자리 버튼이 재생 버튼으로 바뀌고, 누르면 주행을 재개한다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: '주행 기록 일시정지' }))
    const resume = await screen.findByRole('button', { name: '주행 기록 재개' })
    expect(screen.queryByRole('button', { name: '주행 기록 일시정지' })).not.toBeInTheDocument()

    await user.click(resume)
    expect(await screen.findByRole('button', { name: '주행 기록 일시정지' })).toBeInTheDocument()
    expect(screen.queryByText('기록이 중단되었어요.')).not.toBeInTheDocument()
  })

  it('나가기 → 드라이브 종료를 누르면 도착 팝업 없이 홈으로 간다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: '드라이브 마치기' }))
    const confirm = await screen.findByRole('dialog', { name: '드라이브를 마치시겠어요?' })
    await user.click(within(confirm).getByRole('button', { name: '드라이브 종료' }))

    expect(await screen.findByRole('button', { name: '드라이브 시작하기' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /목적지에 도착했어요!/ })).not.toBeInTheDocument()
  })

  it('주행 중 경로 탐색을 누르면 정해 둔 목적지로 검색한 결과를 보여 준다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: '경로 탐색' }))

    expect(await screen.findByRole('textbox', { name: '도착지' })).toHaveValue('서울 반포 한강공원')
    expect(await screen.findByRole('list', { name: '검색 결과' })).toBeInTheDocument()
  })

  it('휴게소 스탬프 탭: 잠긴 칸 → 현재 위치로 찾기 → 도장찍기 (이미 찍은 곳이면 안내)', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('tab', { name: '휴게소 스탬프' }))
    expect(await screen.findByLabelText('16개 중 3개')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '도장 찍기' })[0])
    const popup = await screen.findByRole('dialog', { name: '휴게소 도장 찍기' })
    expect(within(popup).getByRole('button', { name: '도장찍기' })).toBeDisabled()

    await user.click(within(popup).getByRole('button', { name: '현재 위치로 찾기' }))
    await waitFor(() => expect(within(popup).getByRole('textbox', { name: '휴게소 이름' })).toHaveValue('시흥하늘휴게소'))
    await user.click(within(popup).getByRole('button', { name: '도장찍기' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미 찍은 도장이에요.')
    expect(screen.getByLabelText('16개 중 3개')).toBeInTheDocument()
  })

  it('휴게소 스탬프 탭: 도장 팝업의 검색창 → 휴게소 검색 → 고르고 도장찍기를 누르면 도장이 하나 늘어난다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('tab', { name: '휴게소 스탬프' }))
    await user.click((await screen.findAllByRole('button', { name: '도장 찍기' }))[0])
    await user.click(within(await screen.findByRole('dialog', { name: '휴게소 도장 찍기' })).getByRole('textbox', { name: '휴게소 이름' }))

    const search = await screen.findByRole('dialog', { name: '휴게소 검색' })
    await user.type(within(search).getByRole('textbox', { name: '휴게소 이름' }), '덕평')
    await user.click(await within(search).findByRole('button', { name: /덕평\s*자연휴게소/ }))

    const popup = await screen.findByRole('dialog', { name: '휴게소 도장 찍기' })
    expect(within(popup).getByRole('textbox', { name: '휴게소 이름' })).toHaveValue('덕평자연휴게소')

    await user.click(within(popup).getByRole('button', { name: '도장찍기' }))
    expect(await screen.findByRole('status')).toHaveTextContent('도장을 찍었어요!')
    expect(await screen.findByLabelText('16개 중 4개')).toBeInTheDocument()
  })

  it('휴게소 스탬프 탭: 찍은 도장을 누르면 휴게소 상세와 대표 메뉴를 보여 준다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('tab', { name: '휴게소 스탬프' }))
    await user.click(await screen.findByRole('button', { name: '시흥하늘휴게소 도장' }))

    const detail = await screen.findByRole('dialog', { name: '시흥하늘휴게소' })
    expect(within(detail).getByText('수도권제1순환고속도로')).toBeInTheDocument()
    expect(within(detail).getAllByRole('listitem')).toHaveLength(4)
  })

  it('주행 중에 홈으로 나가면 기록 중인 드라이브 배너가 뜨고, 누르면 드라이브 화면으로 돌아간다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: '드라이브 마치기' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '닫기' }))
    cleanup()
    const home = renderApp()
    await home.click(await screen.findByRole('button', { name: '나중에' }))
    await home.click(await screen.findByRole('button', { name: /현재 기록 중인 드라이브가 있어요/ }))

    expect(await screen.findByRole('button', { name: '드라이브 마치기' })).toBeInTheDocument()
  })

  it('DJ 플레이리스트: 카드 → 취향 선택 → 만들기 → 생성 중 → 생성 완료', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /DJ 플레이리스트/ }))
    await user.click(within(await screen.findByRole('list', { name: '분위기' })).getByRole('button', { name: /신나는/ }))
    await user.click(within(screen.getByRole('list', { name: '날씨' })).getByRole('button', { name: /맑음/ }))
    await user.click(screen.getByRole('button', { name: /AI 플레이리스트 만들기/ }))

    expect(await screen.findByText('잠시만 기다려주세요..')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '노을처럼 따뜻한 우리' }, { timeout: 3000 })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '플레이리스트 저장' }))
    expect(screen.getByRole('button', { name: '플레이리스트 저장 취소' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 만들기' }))
    expect(await screen.findByRole('button', { name: /AI 플레이리스트 만들기/ })).toBeInTheDocument()
  })

  it('DJ 플레이리스트: 생성 완료에서 저장하기를 누르면 저장하고 드라이브 화면으로 돌아간다', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /DJ 플레이리스트/ }))
    await user.click(within(await screen.findByRole('list', { name: '분위기' })).getByRole('button', { name: /신나는/ }))
    await user.click(within(screen.getByRole('list', { name: '날씨' })).getByRole('button', { name: /맑음/ }))
    await user.click(screen.getByRole('button', { name: /AI 플레이리스트 만들기/ }))
    await screen.findByRole('heading', { name: '노을처럼 따뜻한 우리' }, { timeout: 3000 })

    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('button', { name: '드라이브 마치기' })).toBeInTheDocument()
    expect((await mockGetPlaylist('ply_mock_1')).data.savedByMe).toBe(true)
  })

  it('라디오: 카드 → 사연 입력 → 보내기 → 재생 중 → 중단하기', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /라디오/ }))
    const send = await screen.findByRole('button', { name: '사연 보내기' })
    expect(send).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: '사연' }), '운전해줘서 고마워')
    expect(screen.getByText('9 / 300')).toBeInTheDocument()
    await user.click(send)

    expect(await screen.findByRole('heading', { name: '사연 재생 중' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText(/“운전해줘서 고마워”/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '일시정지' }))
    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '중단하기' }))
    expect(screen.getByRole('heading', { name: '사연 입력하기' })).toBeInTheDocument()
  })

  it('밸런스 게임: 카드 → 문제 생성 → 고르기 → 다음 문제 → 게임 중단', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /밸런스 게임/ }))
    expect(screen.getByText('밸런스 게임 문제를 만들고 있어요.')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: '드라이브 중 하나만 가능하다면?' }, { timeout: 3000 }),
    ).toBeInTheDocument()

    expect(screen.getByRole('group', { name: '민준 선택' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '민지 선택' })).toBeInTheDocument()

    const next = screen.getByRole('button', { name: '다음 문제' })
    expect(next).toBeDisabled()
    const mine = screen.getByRole('group', { name: '민준 선택' })
    const partner = screen.getByRole('group', { name: '민지 선택' })
    await user.click(within(mine).getByRole('button', { name: 'A' }))
    await user.click(within(partner).getByRole('button', { name: 'B' }))
    expect(within(mine).getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(partner).getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(next)
    expect(await screen.findByRole('heading', { name: '휴게소에서 하나만 먹는다면?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '게임 중단하기' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '그만하기' }))
    expect(await screen.findByRole('button', { name: '드라이브 마치기' })).toBeInTheDocument()
  })

  it('넌센스 퀴즈: 카드 → 초성 힌트 → 정답 보기 → 누가 맞혔는지 → 다음 문제', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /넌센스 퀴즈/ }))
    expect(await screen.findByRole('heading', { name: '세상에서 가장 추운 바다는?' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 문제' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '초성 힌트 보기' }))
    expect(await screen.findByText('ㅆ')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '정답 보기' }))
    expect(await screen.findByText('썰')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '민준' }))
    expect(screen.getByRole('button', { name: '민준' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(await screen.findByRole('heading', { name: '왕이 넘어지면?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '초성 힌트 보기' }))
    expect(await screen.findAllByText('ㅋ')).toHaveLength(2)
  })

  it('추억 게임: 카드 → 누가 맞혔는지 고르기 → 다음 문제 (안 골라도 넘어간다)', async () => {
    setMockGenerateMs(300)
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /추억 게임/ }))
    expect(
      await screen.findByRole('heading', { name: '우리가 가장 먼저 기록한 드라이브 장소는 어디였을까요?' }, { timeout: 3000 }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '민준' }))
    expect(screen.getByRole('button', { name: '민준' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(await screen.findByRole('heading', { name: /가장 오래 머문 휴게소/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '민준' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(await screen.findByRole('heading', { name: /처음으로 함께 본 바다/ })).toBeInTheDocument()
  })

  it('라디오: 보낸 사연 목록에서 사연을 고르면 재생되고, 드라이브 카드에 재생 중이 뜬다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: /라디오/ }))
    await user.click(await screen.findByRole('button', { name: '보낸 사연 목록' }))
    const drawer = await screen.findByRole('dialog', { name: '보낸 사연 목록' })
    await user.click(await within(drawer).findByRole('button', { name: /백일이 됐어/ }))

    expect(await screen.findByRole('heading', { name: '사연 재생 중' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /라디오\s*재생 중/ })).toBeInTheDocument()
  })

  it('드라이브 마치기 팝업에서 경로 수정을 누르면 경로 설정 화면으로 간다', async () => {
    const user = await startDriving()

    await user.click(screen.getByRole('button', { name: '드라이브 마치기' }))
    await user.click(await screen.findByRole('button', { name: '경로 수정' }))

    expect(await screen.findByRole('heading', { level: 1, name: '경로 설정' })).toBeInTheDocument()
  })
})

describe('드라이브 카드 작성', () => {
  const pendingBanner = () => screen.queryByRole('button', { name: /미작성 드라이브 카드/ })

  it("홈에 들어오면 미작성 카드 팝업을 띄우고, '나중에'를 누르면 배너만 남는다. 팝업은 다시 띄우지 않는다", async () => {
    const user = renderApp()

    await screen.findByRole('dialog', { name: '아직 작성하지 않은 드라이브 카드가 있어요' })
    await user.click(screen.getByRole('button', { name: '나중에' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(pendingBanner()).toHaveTextContent('미작성 드라이브 카드 1개')

    // 다른 화면에 갔다가 돌아와도 팝업은 다시 뜨지 않는다
    await user.click(await screen.findByRole('button', { name: '알림 (새 알림 있음)' }))
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(await screen.findByRole('button', { name: /미작성 드라이브 카드 1개/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("팝업의 '카드 작성하러 가기' → 소감 작성 → 저장하면 홈으로 돌아오고 배너가 사라진다", async () => {
    const user = renderApp()

    await screen.findByRole('dialog', { name: '아직 작성하지 않은 드라이브 카드가 있어요' })
    await user.click(screen.getByRole('button', { name: '카드 작성하러 가기' }))

    expect(await screen.findByRole('heading', { level: 1, name: '2026년 11월 3일' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: '내 한 줄 소감' }), '노을이 진짜 예뻤다')
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
    await waitFor(() => expect(pendingBanner()).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('배너로 들어가 저장하지 않고 나가면 작성 중단 팝업을 거쳐 홈으로 돌아오고, 배너는 남는다', async () => {
    const user = renderApp()

    await user.click(await screen.findByRole('button', { name: '나중에' }))
    await user.click(screen.getByRole('button', { name: /미작성 드라이브 카드 1개/ }))
    await screen.findByRole('heading', { level: 1, name: '2026년 11월 3일' })

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    await user.click(screen.getByRole('button', { name: '나가기' }))

    expect(await screen.findByRole('button', { name: /미작성 드라이브 카드 1개/ })).toBeInTheDocument()
  })

  // 기능명세서 드라이브 18: 기록 지도에서도 24시간 동안 '카드 작성 이어서 하기'를 띄운다
  it('기록 지도에도 미작성 카드 배너가 뜨고, 누르면 그 카드 작성 화면으로 간다', async () => {
    const user = renderApp('/map')

    await user.click(await screen.findByRole('button', { name: /미작성 드라이브 카드 1개/ }))

    expect(await screen.findByRole('heading', { level: 1, name: '2026년 11월 3일' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '내 한 줄 소감' })).toBeInTheDocument()
  })

  it('카드 작성 주소로 바로 들어올 수 있다', async () => {
    renderApp('/drives/drv_01/card')

    expect(await screen.findByText('우리의 첫 바다 드라이브')).toBeInTheDocument()
    // 소감 칸은 운전자 · 동승자 대신 닉네임으로 표시한다 (목: 나 민준=동승자, 연인 민지=운전자)
    // 연인 닉네임은 홈 정보(GET /home)를 받은 뒤 채워진다
    await waitFor(() =>
      expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['민준', '민지']),
    )
  })
})
