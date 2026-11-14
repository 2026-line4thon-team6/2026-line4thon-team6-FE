import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockCards } from '@/mocks/cards'
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
  })
})
