import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { logout } from '@/api/auth'
import { MOCK_PARTNER_INVITE_CODE, mockEndSession, mockFetchMe, resetMockCouple } from '@/mocks/couples'
import { resetMockPlaces } from '@/mocks/places'
import App from './App'

// 백엔드 주소가 없는 테스트 환경에서는 API 함수가 목 데이터로 응답한다
function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

beforeEach(() => {
  resetMockCouple()
  resetMockPlaces()
  localStorage.clear()
  sessionStorage.clear()
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
