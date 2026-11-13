import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

// 카카오 지도 SDK는 jsdom에서 동작하지 않으므로 지도 자리만 그린다
vi.mock('./pages/RecordMap/RecordMapView', () => ({ default: () => <div data-testid="map" /> }))

// 백엔드 주소가 없는 테스트 환경에서는 API 함수가 목 데이터로 응답한다
function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

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
    vi.useRealTimers()
  })
})
