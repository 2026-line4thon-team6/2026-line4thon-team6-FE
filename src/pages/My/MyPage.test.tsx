import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_COUPLE } from '@/mocks/couples'
import MyPage from './MyPage'

// 기능명세서 '1️⃣2️⃣ 마이페이지', '1️⃣7️⃣ 로그아웃' · Figma 'My_UI > 마이 · 로그아웃' 기준
type Props = ComponentProps<typeof MyPage>

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onProfileClick: vi.fn(),
    onMenuClick: vi.fn(),
    onLogout: vi.fn(),
    onTabChange: vi.fn(),
    onWithdraw: vi.fn().mockResolvedValue('redirecting'),
  }
  render(<MyPage status="ready" couple={MOCK_COUPLE.couple} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('상단 프로필 카드', () => {
  it('붕붕이명, 누적 주행 거리와 함께한 일수를 표시한다', () => {
    renderPage()

    const card = screen.getByRole('button', { name: /붕붕이/ })
    expect(card).toHaveTextContent('누적 330km · D+23')
  })

  it('카드를 누르면 커플 페이지로 이동한다', async () => {
    const { user, onProfileClick } = renderPage()

    await user.click(screen.getByRole('button', { name: /붕붕이/ }))

    expect(onProfileClick).toHaveBeenCalled()
  })

  it("불러오지 못하면 값을 '--'로 표시한다", () => {
    renderPage({ status: 'error', couple: null })

    expect(screen.getByRole('button', { name: /누적 --km · D\+--/ })).toBeInTheDocument()
  })

  it('연인과 연결하지 않았으면 연결을 안내한다', () => {
    renderPage({ status: 'ready', couple: null })

    expect(screen.getByRole('button', { name: /연인과 연결해 보세요/ })).toBeInTheDocument()
  })
})

describe('메뉴', () => {
  it('보관함 · 문서 · 기타 세 묶음의 메뉴를 순서대로 표시한다', () => {
    renderPage()

    const groups = screen.getAllByRole('list', { name: /메뉴/ })
    expect(groups.map((group) => within(group).getAllByRole('button').map((button) => button.textContent))).toEqual([
      ['🗺️찜한 드라이브 코스', '🎧플레이리스트 보관함', '📻라디오 사연 보관함'],
      ['📄개인정보 처리 방침', '📎이용 약관', '🗓️오픈소스 라이선스'],
      ['❓자주 묻는 질문 (FAQ)', '🚪로그아웃'],
    ])
  })

  it.each([
    ['찜한 드라이브 코스', 'favorites'],
    ['플레이리스트 보관함', 'playlists'],
    ['라디오 사연 보관함', 'stories'],
    ['개인정보 처리 방침', 'privacy'],
    ['이용 약관', 'terms'],
    ['오픈소스 라이선스', 'openSource'],
    ['자주 묻는 질문 (FAQ)', 'faq'],
  ])("'%s'를 누르면 해당 화면으로 이동을 요청한다", async (label, menu) => {
    const { user, onMenuClick } = renderPage()

    await user.click(screen.getByRole('button', { name: label }))

    expect(onMenuClick).toHaveBeenCalledWith(menu)
  })
})

describe('앱 설치하기', () => {
  it('설치할 수 있으면 메뉴 맨 아래에 앱 설치하기를 보여 준다', () => {
    renderPage({ installMode: 'prompt', onInstall: vi.fn() })

    const groups = screen.getAllByRole('list', { name: /메뉴/ })
    const last = within(groups.at(-1)!).getAllByRole('button').at(-1)
    expect(last).toHaveAccessibleName('앱 설치하기')
  })

  it('이미 앱으로 실행 중이면 보여 주지 않는다', () => {
    renderPage({ installMode: null })

    expect(screen.queryByRole('button', { name: '앱 설치하기' })).not.toBeInTheDocument()
  })

  it('브라우저 설치 창이 있으면 바로 설치를 요청한다', async () => {
    const onInstall = vi.fn()
    const { user } = renderPage({ installMode: 'prompt', onInstall })

    await user.click(screen.getByRole('button', { name: '앱 설치하기' }))

    expect(onInstall).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('아이폰은 공유 메뉴의 홈 화면에 추가를 안내한다', async () => {
    const { user } = renderPage({ installMode: 'ios', onInstall: vi.fn() })

    await user.click(screen.getByRole('button', { name: '앱 설치하기' }))

    const sheet = screen.getByRole('dialog', { name: '홈 화면에 붕붕어스 추가하기' })
    expect(sheet).toHaveTextContent('공유')
    expect(sheet).toHaveTextContent('홈 화면에 추가')

    await user.click(within(sheet).getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('설치 창이 없는 다른 브라우저는 브라우저 메뉴를 안내한다', async () => {
    const { user } = renderPage({ installMode: 'manual', onInstall: vi.fn() })

    await user.click(screen.getByRole('button', { name: '앱 설치하기' }))

    expect(screen.getByRole('dialog', { name: '홈 화면에 붕붕어스 추가하기' })).toHaveTextContent('브라우저 메뉴')
  })
})

describe('로그아웃 바텀시트', () => {
  it('로그아웃을 누르면 확인 시트를 연다 (닫기 버튼 없이 손잡이만)', async () => {
    const { user, onLogout } = renderPage()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    const sheet = within(screen.getByRole('dialog', { name: '로그아웃 하시겠습니까?' }))
    expect(sheet.getByText(/로그아웃해도 저장된 드라이브 기록은/)).toBeInTheDocument()
    expect(sheet.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
    expect(onLogout).not.toHaveBeenCalled()
  })

  it("시트의 '로그아웃'을 누르면 로그아웃한다", async () => {
    const { user, onLogout } = renderPage()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '로그아웃' }))

    expect(onLogout).toHaveBeenCalled()
  })

  it("'취소'를 누르면 시트만 닫는다", async () => {
    const { user, onLogout } = renderPage()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onLogout).not.toHaveBeenCalled()
  })
})

describe('하단 네비바', () => {
  it('마이 탭을 현재 탭으로 강조하고, 다른 탭을 누르면 이동을 요청한다', async () => {
    const { user, onTabChange } = renderPage()
    const nav = within(screen.getByRole('navigation', { name: '메인 메뉴' }))

    expect(nav.getByRole('button', { name: '마이' })).toHaveAttribute('aria-current', 'page')
    await user.click(nav.getByRole('button', { name: '홈' }))

    expect(onTabChange).toHaveBeenCalledWith('home')
  })
})

// 회원 탈퇴: 마이 맨 아래의 작은 글자 버튼 → 안내 · 확인 시트 → 카카오 본인 확인 (Figma 시안 없음)
describe('회원탈퇴', () => {
  const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: '회원탈퇴' }))
    return screen.getByRole('dialog', { name: '정말 탈퇴하시겠어요?' })
  }

  it('메뉴 맨 아래에 회원탈퇴 버튼이 있고, 누르면 탈퇴하면 생기는 일을 안내한다', async () => {
    const { user } = renderPage()

    const sheet = await openSheet(user)
    expect(sheet).toHaveTextContent('커플 연결이 해제돼요')
    expect(sheet).toHaveTextContent('되돌릴 수 없어요')
    expect(sheet).toHaveTextContent('카카오로 본인 확인')
  })

  it('안내를 확인했다고 체크해야 탈퇴를 진행할 수 있다', async () => {
    const { user, onWithdraw } = renderPage()
    const sheet = await openSheet(user)
    const confirm = within(sheet).getByRole('button', { name: '카카오로 본인 확인하고 탈퇴' })

    expect(confirm).toBeDisabled()
    await user.click(within(sheet).getByRole('checkbox', { name: '안내를 모두 확인했어요' }))
    await user.click(confirm)

    expect(onWithdraw).toHaveBeenCalledTimes(1)
  })

  it('진행 중인 드라이브가 있으면 시트에 이유를 보여 준다', async () => {
    const { user } = renderPage({ onWithdraw: vi.fn().mockResolvedValue('activeDrive') })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('checkbox', { name: '안내를 모두 확인했어요' }))
    await user.click(within(sheet).getByRole('button', { name: '카카오로 본인 확인하고 탈퇴' }))

    expect(await within(sheet).findByRole('alert')).toHaveTextContent('진행 중인 드라이브가 있어요.')
  })

  it('취소를 누르면 시트를 닫는다', async () => {
    const { user, onWithdraw } = renderPage()
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).not.toBeInTheDocument()
    expect(onWithdraw).not.toHaveBeenCalled()
  })

  it('본인 확인 후 탈퇴하지 못하고 돌아왔으면 이유를 알려 준다', () => {
    renderPage({ withdrawError: '지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요.' })

    expect(screen.getByRole('status')).toHaveTextContent('지금은 탈퇴를 처리할 수 없어요.')
  })
})
