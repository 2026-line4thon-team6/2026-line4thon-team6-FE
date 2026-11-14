import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prepareDrive } from '@/api/drives'
import { resetMockCards } from '@/mocks/cards'
import { resetMockDrives } from '@/mocks/drives'
import { resetMockRoutes } from '@/mocks/routes'
import { resetMockSearchHistory } from '@/mocks/search'
import App from './App'

// 카카오 지도 SDK는 jsdom에서 동작하지 않으므로 지도 자리만 그린다
vi.mock('./pages/RecordMap/RecordMapView', () => ({ default: () => <div data-testid="map" /> }))

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

describe('홈 ↔ 기록 지도 이동', () => {
  it('하단 네비바의 기록 지도 탭을 누르면 함께한 드라이브 횟수가 보이고, 홈 탭으로 돌아올 수 있다', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('button', { name: '기록 지도' }))

    expect(screen.getByRole('heading', { level: 1, name: '우리 어디까지 가봤지?' })).toBeInTheDocument()
    expect(await screen.findByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '홈' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('오늘은 어디로 떠나볼까요?')
  })

  it('기록 지도에서 검색하면 검색어에 맞는 기록만 다시 불러온다', async () => {
    const user = renderApp('/map')
    await screen.findByText('총 12번의 드라이브를 함께했어요')

    await user.type(screen.getByRole('searchbox', { name: '기록 검색' }), '오이도{Enter}')

    expect(await screen.findByText('총 2번의 드라이브를 함께했어요')).toBeInTheDocument()
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
  })
})
