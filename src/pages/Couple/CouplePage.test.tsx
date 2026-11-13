import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_COUPLE, MOCK_ME } from '@/mocks/couples'
import CouplePage from './CouplePage'

// 기능명세서 '1️⃣3️⃣ 커플 페이지', '1️⃣6️⃣ 커플 연결 끊기' · Figma 'My_UI > 커플 페이지 · 붕붕이명 · 편집 · 연결 끊기' 기준
type Props = ComponentProps<typeof CouplePage>

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onRetry: vi.fn(),
    onChangeStartDate: vi.fn().mockResolvedValue(null),
    onRenameMascot: vi.fn().mockResolvedValue(null),
    onUpdateProfile: vi.fn().mockResolvedValue(null),
    onCopyInviteCode: vi.fn().mockResolvedValue(undefined),
    onDisconnect: vi.fn().mockResolvedValue(null),
    onDisconnected: vi.fn(),
  }
  render(
    <CouplePage
      status="ready"
      couple={MOCK_COUPLE.couple}
      me={MOCK_ME}
      inviteCode="jsd82nk9"
      today="2026-11-13"
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

describe('계정 정보', () => {
  it('커플 시작일과 붕붕이명을 표시한다', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '커플 페이지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /우리의 시작/ })).toHaveTextContent('2026.10.20')
    expect(screen.getByRole('button', { name: /붕붕이/ })).toHaveTextContent('이름 변경하기')
  })

  it('두 사람의 닉네임 · 생년월일 · 로그인 방식을 내 정보부터 표시하고, 내 정보에만 편집 버튼이 있다', () => {
    renderPage()

    const [mine, partner] = within(screen.getByRole('list', { name: '두 사람 정보' })).getAllByRole('listitem')
    expect(mine).toHaveTextContent('민준')
    expect(mine).toHaveTextContent('2003.05.06')
    expect(mine).toHaveTextContent('카카오 로그인')
    expect(within(mine).getByRole('button', { name: '편집' })).toBeInTheDocument()

    expect(partner).toHaveTextContent('민지')
    expect(within(partner).queryByRole('button', { name: '편집' })).not.toBeInTheDocument()
  })
})

describe('우리의 시작 (시작일 변경 바텀시트)', () => {
  it('행을 누르면 현재 시작일을 고른 날짜 휠을 연다', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: /우리의 시작/ }))

    const sheet = within(screen.getByRole('dialog', { name: '커플 시작일 변경' }))
    expect(sheet.getByRole('listbox', { name: '년' })).toHaveTextContent('2026년')
    expect(sheet.getByRole('option', { name: '2026년', selected: true })).toBeInTheDocument()
  })

  it('날짜를 고르고 저장하면 시작일을 바꾸고 시트를 닫는다', async () => {
    const { user, onChangeStartDate } = renderPage()

    await user.click(screen.getByRole('button', { name: /우리의 시작/ }))
    await user.click(screen.getByRole('option', { name: '2025년' }))
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(onChangeStartDate).toHaveBeenCalledWith('2025-10-20')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('저장에 실패하면 시트에 안내를 띄운다', async () => {
    const { user } = renderPage({ onChangeStartDate: vi.fn().mockResolvedValue('오늘 이후 날짜는 고를 수 없어요.') })

    await user.click(screen.getByRole('button', { name: /우리의 시작/ }))
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('오늘 이후 날짜는 고를 수 없어요.')
  })
})

describe('붕붕이명 변경 팝업', () => {
  it('현재 이름을 채워 열고, 고친 이름으로 저장한다', async () => {
    const { user, onRenameMascot } = renderPage()

    await user.click(screen.getByRole('button', { name: /붕붕이/ }))
    const input = screen.getByRole('textbox', { name: '붕붕이명' })
    expect(input).toHaveValue('붕붕이')
    expect(input).toHaveAttribute('maxLength', '20')

    await user.clear(input)
    await user.type(input, '씽씽이')
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(onRenameMascot).toHaveBeenCalledWith('씽씽이')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('이름을 비우면 저장할 수 없고, 취소하면 닫힌다', async () => {
    const { user, onRenameMascot } = renderPage()

    await user.click(screen.getByRole('button', { name: /붕붕이/ }))
    await user.clear(screen.getByRole('textbox', { name: '붕붕이명' }))

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onRenameMascot).not.toHaveBeenCalled()
  })
})

describe('내 정보 편집 팝업', () => {
  it('닉네임 · 생년월일을 채워 열고, 고친 값으로 저장한다', async () => {
    const { user, onUpdateProfile } = renderPage()

    await user.click(screen.getByRole('button', { name: '편집' }))
    const nickname = screen.getByRole('textbox', { name: '닉네임' })
    const birthDate = screen.getByRole('textbox', { name: '생년월일' })
    expect(nickname).toHaveValue('민준')
    expect(birthDate).toHaveValue('2003.05.06')

    await user.clear(nickname)
    await user.type(nickname, '준이')
    await user.clear(birthDate)
    await user.type(birthDate, '20020102')
    expect(birthDate).toHaveValue('2002.01.02')
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(onUpdateProfile).toHaveBeenCalledWith({ nickname: '준이', birthDate: '2002-01-02' })
  })

  it('없는 날짜나 미래 생년월일은 저장하지 않고 안내한다', async () => {
    const { user, onUpdateProfile } = renderPage()

    await user.click(screen.getByRole('button', { name: '편집' }))
    const birthDate = screen.getByRole('textbox', { name: '생년월일' })
    await user.clear(birthDate)
    await user.type(birthDate, '20031340')
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('생년월일을 다시 확인해 주세요.')
    expect(onUpdateProfile).not.toHaveBeenCalled()
  })

  it('생년월일을 비우면 삭제(null)로 저장한다', async () => {
    const { user, onUpdateProfile } = renderPage()

    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.clear(screen.getByRole('textbox', { name: '생년월일' }))
    await user.click(screen.getByRole('button', { name: '저장하기' }))

    expect(onUpdateProfile).toHaveBeenCalledWith({ nickname: '민준', birthDate: null })
  })
})

describe('커플 연결', () => {
  it('커플 코드 복사하기를 누르면 코드를 복사하고 안내를 잠깐 띄운다', async () => {
    const { user, onCopyInviteCode } = renderPage()

    await user.click(screen.getByRole('button', { name: /커플 코드 복사하기/ }))

    expect(onCopyInviteCode).toHaveBeenCalledWith('jsd82nk9')
    expect(await screen.findByRole('status')).toHaveTextContent('커플 코드가 복사되었습니다.')
  })

  it('커플 코드를 불러오지 못했으면 복사할 수 없다', () => {
    renderPage({ inviteCode: null })

    expect(screen.getByRole('button', { name: /커플 코드 복사하기/ })).toBeDisabled()
  })

  it("'커플 연결 끊기' → '연결 해제'를 누르면 연결을 해제하고 알린다", async () => {
    const { user, onDisconnect, onDisconnected } = renderPage()

    await user.click(screen.getByRole('button', { name: /커플 연결 끊기/ }))
    const sheet = within(screen.getByRole('dialog', { name: '커플 연결을 해제하시겠습니까?' }))
    expect(sheet.getByText(/커플 공유 기능을/)).toBeInTheDocument()
    await user.click(sheet.getByRole('button', { name: '연결 해제' }))

    expect(onDisconnect).toHaveBeenCalled()
    expect(onDisconnected).toHaveBeenCalled()
  })

  it('해제에 실패하면 시트에 안내를 띄우고, 취소하면 닫힌다', async () => {
    const { user, onDisconnected } = renderPage({
      onDisconnect: vi.fn().mockResolvedValue('진행 중인 드라이브를 먼저 끝낸 뒤 해제해 주세요.'),
    })

    await user.click(screen.getByRole('button', { name: /커플 연결 끊기/ }))
    await user.click(screen.getByRole('button', { name: '연결 해제' }))
    expect(screen.getByRole('alert')).toHaveTextContent('진행 중인 드라이브를 먼저 끝낸 뒤 해제해 주세요.')
    expect(onDisconnected).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('그 밖의 상태', () => {
  it('뒤로가기를 누르면 이전 화면으로 돌아간다', async () => {
    const { user, onBack } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onBack).toHaveBeenCalled()
  })

  it('연결된 연인이 없으면 안내한다', () => {
    renderPage({ status: 'unlinked', couple: null })

    expect(screen.getByText('연결된 연인이 없어요.')).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', couple: null, me: null })

    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalled()
  })
})
