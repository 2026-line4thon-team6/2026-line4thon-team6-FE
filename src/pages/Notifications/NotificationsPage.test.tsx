import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createMockNotifications } from '@/mocks/notifications'
import NotificationsPage from './NotificationsPage'

// 기능명세서 '3️⃣ 알림 목록 화면' 기준
type Props = ComponentProps<typeof NotificationsPage>

const NOW = new Date('2026-11-10T12:00:00Z').getTime()
const SERVER_TIME = new Date(NOW).toISOString()
// 17시간 전(안 읽음) / 1일 전(읽음) / 8일 전(읽음)
const NOTIFICATIONS = createMockNotifications(NOW)

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onNotificationClick: vi.fn(),
    onRetry: vi.fn(),
    onLoadMore: vi.fn(),
    onTabChange: vi.fn(),
  }
  render(
    <NotificationsPage
      status="ready"
      notifications={NOTIFICATIONS}
      serverTime={SERVER_TIME}
      hasMore={false}
      loadingMore={false}
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

const section = (name: string) => screen.getByRole('region', { name })

describe('알림 목록', () => {
  it('제목과 뒤로가기를 표시하고, 뒤로가기를 탭하면 홈으로 돌아가기를 요청한다', async () => {
    const { user, onBack } = renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '알림' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("'최근 7일'과 '최근 30일'로 나누어 표시한다", () => {
    renderPage()

    const recent = within(section('최근 7일')).getAllByRole('listitem')
    const older = within(section('최근 30일')).getAllByRole('listitem')
    expect(recent.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      '민지님이 드라이브 장소를 공유했어요. 💌',
      '민지님이 드라이브 소감을 남겼어요.',
    ])
    expect(older.map((item) => within(item).getByRole('heading').textContent)).toEqual(['민지님과 연결되었어요.'])
  })

  it('알림 제목, 설명, 수신 시간을 표시한다', () => {
    renderPage()

    const [first, second] = within(section('최근 7일')).getAllByRole('listitem')
    expect(first).toHaveTextContent('이번 주말, 함께 떠나보는 건 어떨까요?')
    expect(first).toHaveTextContent('17시간 전')
    expect(second).toHaveTextContent('1일 전')
    expect(section('최근 30일')).toHaveTextContent('8일 전')
  })

  it('수신 시간은 기기 시계가 아니라 서버 시각 기준으로 계산한다', () => {
    renderPage({ serverTime: new Date(NOW + 60 * 60 * 1000).toISOString() })

    expect(within(section('최근 7일')).getAllByRole('listitem')[0]).toHaveTextContent('18시간 전')
  })

  it('해당 기간에 알림이 없으면 그 구분은 표시하지 않는다', () => {
    renderPage({ notifications: NOTIFICATIONS.slice(0, 2) })

    expect(section('최근 7일')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '최근 30일' })).not.toBeInTheDocument()
  })

  it('읽지 않은 알림과 읽은 알림을 구분한다', () => {
    renderPage()

    const [unread, read] = within(section('최근 7일')).getAllByRole('listitem')
    expect(within(unread).getByText('읽지 않음')).toBeInTheDocument()
    expect(within(read).queryByText('읽지 않음')).not.toBeInTheDocument()
  })

  it('알림을 탭하면 해당 알림을 넘겨 읽음 처리와 이동을 요청한다', async () => {
    const { user, onNotificationClick } = renderPage()

    await user.click(screen.getByRole('button', { name: /민지님이 드라이브 장소를 공유했어요/ }))

    expect(onNotificationClick).toHaveBeenCalledTimes(1)
    expect(onNotificationClick).toHaveBeenCalledWith(NOTIFICATIONS[0])
  })
})

describe('불러오기 상태', () => {
  it('불러오는 중에는 안내를 표시하고 목록은 표시하지 않는다', () => {
    renderPage({ status: 'loading', notifications: [], serverTime: null })

    expect(screen.getByRole('status')).toHaveTextContent('알림을 불러오고 있어요.')
    expect(within(screen.getByRole('main')).queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('알림이 하나도 없으면 안내 문구를 표시한다', () => {
    renderPage({ notifications: [] })

    expect(screen.getByText('아직 받은 알림이 없어요.')).toBeInTheDocument()
  })

  it('불러오지 못하면 안내와 다시 시도 버튼을 표시한다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', notifications: [], serverTime: null })

    expect(screen.getByRole('alert')).toHaveTextContent('알림을 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('다음 페이지가 있으면 더 보기 버튼을 표시하고, 탭하면 다음 페이지를 요청한다', async () => {
    const { user, onLoadMore } = renderPage({ hasMore: true })

    await user.click(screen.getByRole('button', { name: '더 보기' }))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('다음 페이지가 없으면 더 보기 버튼을 표시하지 않는다', () => {
    renderPage({ hasMore: false })

    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument()
  })

  it('다음 페이지를 불러오는 동안에는 더 보기 버튼을 누를 수 없다', () => {
    renderPage({ hasMore: true, loadingMore: true })

    expect(screen.getByRole('button', { name: '불러오는 중…' })).toBeDisabled()
  })
})

describe('하단 네비바', () => {
  it('다른 탭을 탭하면 해당 탭으로 이동을 요청한다', async () => {
    const { user, onTabChange } = renderPage()

    await user.click(within(screen.getByRole('navigation', { name: '메인 메뉴' })).getByRole('button', { name: '마이' }))

    expect(onTabChange).toHaveBeenCalledWith('my')
  })
})
