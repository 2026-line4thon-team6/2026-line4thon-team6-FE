import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/auth'
import { prepareDrive } from '@/api/drives'
import { MOCK_PARTNER_INVITE_CODE, mockEndSession, mockFetchMe, resetMockCouple } from '@/mocks/couples'
import { resetMockPlaces } from '@/mocks/places'
import { resetMockCards } from '@/mocks/cards'
import { resetMockDrives } from '@/mocks/drives'
import { resetMockRoutes } from '@/mocks/routes'
import { resetMockSearchHistory } from '@/mocks/search'
import { resetMockRecordDeletions } from './mocks/records'
import App from './App'
import type { RecordMapMarker } from './types/record'

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

// 목 서버에서 지운 기록이 다른 테스트에 남지 않게 한다
afterEach(() => resetMockRecordDeletions())

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
  resetMockPlaces()
  localStorage.clear()
  sessionStorage.clear()
  resetMockCards()
})

describe('홈 ↔ 알림 화면 이동', () => {
  it('홈의 알림 버튼 → 알림 목록 → 알림을 탭하면 읽음 처리되고, 홈으로 돌아오면 새 알림 표시가 사라진다', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('button', { name: '알림 (새 알림 있음)' }))

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
    expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: '강릉 헌화로' }))

    expect(await screen.findByRole('heading', { level: 1, name: '강릉 헌화로' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it('상세에서 찜하면 홈으로 돌아왔을 때 카드의 하트에도 반영된다', async () => {
    const user = renderApp()
    await user.click(screen.getByRole('button', { name: '강릉 헌화로' }))
    await screen.findByRole('heading', { level: 1, name: '강릉 헌화로' })

    await user.click(screen.getByRole('button', { name: '좋아요' }))
    expect(await screen.findByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    const card = screen.getByRole('button', { name: '강릉 헌화로' }).closest('article')
    expect(card).not.toBeNull()
    expect(card!.querySelector('button[aria-pressed="true"]')).not.toBeNull()
  })

  it('공유받은 장소 알림을 탭하면 그 장소의 상세 화면으로 이동한다', async () => {
    const user = renderApp('/notifications')

    await user.click(await screen.findByRole('button', { name: /드라이브 장소를 공유했어요/ }))

    expect(await screen.findByRole('heading', { level: 1, name: '시흥 오이도' })).toBeInTheDocument()
  })

  it('연인에게 보내기 → 보내기 → 전송 완료 안내까지 이어진다', async () => {
    const user = renderApp('/places/1')
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
    ['오픈소스 라이선스', '오픈소스 라이선스', '[라이선스 전문]'],
  ])("'%s'를 누르면 문서 화면으로 이동하고, 뒤로가면 마이 화면으로 돌아온다", async (menu, title, text) => {
    const user = renderApp('/my')

    await user.click(await screen.findByRole('button', { name: menu }))

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(await screen.findByText(text)).toBeInTheDocument()

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

  it('코드를 비워 두고 완료를 누르면 연결하지 않고 홈으로 간다', async () => {
    const user = renderApp('/couple/invite')

    await user.click(await screen.findByRole('button', { name: '완료' }))

    expect(await screen.findByRole('heading', { level: 1, name: /오늘은 어디로 떠나볼까요/ })).toBeInTheDocument()
  })
})

describe('로그인 · 가입 (기능명세서 L1~L9)', () => {
  // 로그아웃한 기기: 목 서버는 다음 로그인을 아직 가입하지 않은 새 사용자로 응답한다
  async function signOut() {
    await logout('test-logout')
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

    // L9 연인 초대 → 코드 없이 완료(건너뛰기) → 메인 홈
    expect(await screen.findByRole('heading', { level: 1, name: '연인 초대' })).toBeInTheDocument()
    expect((await mockFetchMe()).data).toMatchObject({
      nickname: '현우',
      birthDate: '2002-03-04',
      gender: 'MALE',
      onboardingCompleted: true,
    })
    await user.click(screen.getByRole('button', { name: '완료' }))
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
  })

  it('시트 바깥을 누르면 드라이브를 만들지 않고 시트가 닫힌다', async () => {
    const user = renderApp()

    await startDriveFromHome(user)
    const sheet = await screen.findByRole('dialog', { name: '드라이브 준비 완료!' })
    // 시트를 감싼 어두운 배경
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

  it('장소 상세의 드라이브 시작하기에서도 드라이브명 시트가 열린다', async () => {
    const user = renderApp('/places/1')
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

describe('드라이브 카드 작성', () => {
  const pendingBanner = () => screen.queryByRole('button', { name: /미작성 드라이브 카드/ })

  it("홈에 들어오면 미작성 카드 팝업을 띄우고, '나중에'를 누르면 배너만 남는다. 팝업은 다시 띄우지 않는다", async () => {
    const user = renderApp()

    await screen.findByRole('dialog', { name: '아직 작성하지 않은 드라이브 카드가 있어요' })
    await user.click(screen.getByRole('button', { name: '나중에' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(pendingBanner()).toHaveTextContent('미작성 드라이브 카드 1개')

    // 다른 화면에 갔다가 돌아와도 팝업은 다시 뜨지 않는다
    await user.click(screen.getByRole('button', { name: '알림 (새 알림 있음)' }))
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
    expect(pendingBanner()).not.toBeInTheDocument()
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

  it('카드 작성 주소로 바로 들어올 수 있다', async () => {
    renderApp('/drives/drv_01/card')

    expect(await screen.findByText('우리의 첫 바다 드라이브')).toBeInTheDocument()
    // 소감 칸은 운전자 · 동승자 대신 닉네임으로 표시한다 (목: 나 민준=동승자, 연인 민지=운전자)
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['민준', '민지'])
  })
})
