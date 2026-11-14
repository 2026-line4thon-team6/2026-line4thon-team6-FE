import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers, createMockRecords } from '@/mocks/records'
import type { RecordMapMarker } from '@/types/record'
import RecordMapPage from './RecordMapPage'
import RecordMarker from './RecordMarker'

// 카카오 지도 SDK는 jsdom에서 동작하지 않으므로, 마커만 그리는 가짜 지도로 바꾼다
vi.mock('./RecordMapView', () => ({
  default: ({ markers, onMarkerClick }: { markers: RecordMapMarker[]; onMarkerClick: (marker: RecordMapMarker) => void }) => (
    <div data-testid="map">
      {markers.map((marker) => (
        <RecordMarker key={marker.groupKey} marker={marker} onClick={onMarkerClick} />
      ))}
    </div>
  ),
}))

// Figma 기록 지도(284:14400 지도형, 284:14758 목록형) Description 1~4, 7 기준
type Props = ComponentProps<typeof RecordMapPage>
const MARKERS = createMockRecordMarkers()
const RECORDS = createMockRecords()

const PAGE_PROPS: Props = {
  view: 'map',
  totalCount: 12,
  date: null,
  mapStatus: 'ready',
  markers: MARKERS,
  listStatus: 'ready',
  records: RECORDS,
  hasMoreRecords: false,
  onSearch: () => {},
  onCalendarClick: () => {},
  onDateClear: () => {},
  onViewChange: () => {},
  onLoadMore: () => {},
  onCardClick: () => {},
  onShare: () => {},
  onRetry: () => {},
}

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onSearch: vi.fn(),
    onCalendarClick: vi.fn(),
    onDateClear: vi.fn(),
    onViewChange: vi.fn(),
    onLoadMore: vi.fn(),
    onCardClick: vi.fn(),
    onShare: vi.fn(),
    onRetry: vi.fn(),
    onTabChange: vi.fn(),
  }
  render(
    <RecordMapPage
      view="map"
      totalCount={12}
      date={null}
      mapStatus="ready"
      markers={MARKERS}
      listStatus="ready"
      records={RECORDS}
      hasMoreRecords={false}
      {...handlers}
      {...props}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RecordMapPage', () => {
  describe('1. 드라이브 기록 현황', () => {
    it('함께한 드라이브 횟수와 제목을 보여준다', () => {
      renderPage({ totalCount: 12 })

      expect(screen.getByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: '우리 어디까지 가봤지?' })).toBeInTheDocument()
    })

    it('전체 기록 수를 모르는 동안에는 횟수를 표시하지 않는다', () => {
      renderPage({ mapStatus: 'loading', markers: [], totalCount: null })

      expect(screen.queryByText(/번의 드라이브를 함께했어요/)).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중이에요')
    })
  })

  describe('2. 드라이브 기록 검색 및 날짜 필터', () => {
    it('검색어를 입력하고 Enter를 누르면 검색한다', async () => {
      const { user, onSearch } = renderPage()

      await user.type(screen.getByRole('searchbox', { name: '기록 검색' }), '바다{Enter}')

      expect(onSearch).toHaveBeenCalledWith('바다')
    })

    it('돋보기 버튼으로도 검색하고, 앞뒤 공백은 지운다', async () => {
      const { user, onSearch } = renderPage()

      await user.type(screen.getByRole('searchbox', { name: '기록 검색' }), '  오이도 ')
      await user.click(screen.getByRole('button', { name: '검색' }))

      expect(onSearch).toHaveBeenCalledWith('오이도')
    })

    it('캘린더 버튼을 누르면 날짜 검색을 연다', async () => {
      const { user, onCalendarClick } = renderPage()

      await user.click(screen.getByRole('button', { name: '날짜로 검색' }))

      expect(onCalendarClick).toHaveBeenCalled()
    })

    it('날짜로 검색 중이면 검색창에 그 날짜를 보여준다 (Figma 284:14543)', () => {
      renderPage({ date: '2026-10-24' })

      expect(screen.getByRole('searchbox', { name: '기록 검색' })).toHaveValue('2026년 10월 24일')
    })

    it('날짜로 검색 중에 글자를 입력하면 날짜 검색을 풀고 검색어 입력으로 바뀐다', async () => {
      const onDateClear = vi.fn()
      const onSearch = vi.fn()
      // 날짜 검색을 풀면 부모가 date를 null로 바꿔 다시 그린다
      function Wrapper() {
        const [date, setDate] = useState<string | null>('2026-10-24')
        return (
          <RecordMapPage
            {...PAGE_PROPS}
            date={date}
            onSearch={onSearch}
            onDateClear={() => {
              onDateClear()
              setDate(null)
            }}
          />
        )
      }
      render(<Wrapper />)
      const user = userEvent.setup()

      const input = screen.getByRole('searchbox', { name: '기록 검색' })
      await user.click(input)
      await user.keyboard('바다{Enter}')

      expect(onDateClear).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('바다')
    })

    it('날짜로 검색 중이면 검색창의 X로 바로 전체 기록으로 돌아갈 수 있다', async () => {
      const onDateClear = vi.fn()
      render(<RecordMapPage {...PAGE_PROPS} date="2026-10-24" onDateClear={onDateClear} />)

      await userEvent.setup().click(screen.getByRole('button', { name: '날짜 검색 해제' }))
      expect(onDateClear).toHaveBeenCalledTimes(1)
    })

    it('날짜로 검색 중이 아니면 X를 보여 주지 않는다', () => {
      renderPage({ date: null })

      expect(screen.queryByRole('button', { name: '날짜 검색 해제' })).not.toBeInTheDocument()
    })

    it('날짜 검색을 풀면 빈 검색창으로 돌아온다', () => {
      const { rerender } = render(<RecordMapPage {...PAGE_PROPS} date="2026-10-24" />)
      rerender(<RecordMapPage {...PAGE_PROPS} date={null} />)

      expect(screen.getByRole('searchbox', { name: '기록 검색' })).toHaveValue('')
    })
  })

  describe('3. 지도형 / 목록형 전환', () => {
    it('지도형이 선택되어 있고, 목록형을 누르면 전환을 요청한다', async () => {
      const { user, onViewChange } = renderPage()

      expect(screen.getByRole('button', { name: '지도형' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '목록형' })).toHaveAttribute('aria-pressed', 'false')

      await user.click(screen.getByRole('button', { name: '목록형' }))

      expect(onViewChange).toHaveBeenCalledWith('list')
    })

    it('목록형에서는 지도 대신 기록 목록을 보여주고, 지도형을 누르면 전환을 요청한다', async () => {
      const { user, onViewChange } = renderPage({ view: 'list' })

      expect(screen.queryByTestId('map')).not.toBeInTheDocument()
      expect(screen.getByRole('list', { name: '드라이브 기록 목록' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '목록형' })).toHaveAttribute('aria-pressed', 'true')

      await user.click(screen.getByRole('button', { name: '지도형' }))

      expect(onViewChange).toHaveBeenCalledWith('map')
    })
  })

  describe('4. 드라이브 기록 미리보기', () => {
    it('지도 위에 기록마다 사진 마커를 보여준다', () => {
      renderPage()

      expect(screen.getAllByRole('button', { name: /기록 보기$/ })).toHaveLength(MARKERS.length)
    })

    it('사진 마커를 누르면 그 목적지의 최신 기록 카드를 띄우고, 카드를 누르면 상세로 이동을 요청한다', async () => {
      const { user, onCardClick } = renderPage()
      const { latestCard } = MARKERS[0]

      await user.click(screen.getByRole('button', { name: `${latestCard.title} 기록 보기` }))

      expect(screen.getByRole('dialog', { name: '드라이브 기록 미리보기' })).toHaveTextContent(latestCard.title)
      await user.click(screen.getByRole('button', { name: `${latestCard.title} 기록 자세히 보기` }))

      expect(onCardClick).toHaveBeenCalledWith(latestCard)
    })

    it('미리보기의 공유 버튼을 누르면 그 기록의 공유를 요청한다', async () => {
      const { user, onShare } = renderPage()

      await user.click(screen.getByRole('button', { name: `${MARKERS[0].latestCard.title} 기록 보기` }))
      await user.click(screen.getByRole('button', { name: '공유하기' }))

      expect(onShare).toHaveBeenCalledWith(MARKERS[0].latestCard)
    })

    it('미리보기를 닫으면 다시 지도를 볼 수 있다', async () => {
      const { user } = renderPage()

      await user.click(screen.getByRole('button', { name: `${MARKERS[0].latestCard.title} 기록 보기` }))
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('7. 드라이브 기록 목록', () => {
    it('기록을 받은 순서(최신순)대로 보여주고, 누르면 상세로 이동을 요청한다', async () => {
      const { user, onCardClick } = renderPage({ view: 'list' })

      const items = within(screen.getByRole('list', { name: '드라이브 기록 목록' })).getAllByRole('listitem')
      expect(items).toHaveLength(RECORDS.length)
      expect(items[0]).toHaveTextContent(RECORDS[0].title)

      await user.click(screen.getByRole('button', { name: new RegExp(RECORDS[1].title) }))

      expect(onCardClick).toHaveBeenCalledWith(RECORDS[1])
    })

    it('조건에 맞는 기록이 없으면 안내 문구를 보여준다', () => {
      renderPage({ view: 'list', records: [] })

      expect(screen.getByText('조건에 맞는 드라이브 기록이 없어요.')).toBeInTheDocument()
    })

    it('목록 끝에 닿으면 다음 기록을 불러온다', () => {
      const observers: { callback: IntersectionObserverCallback }[] = []
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: IntersectionObserverCallback) {
            observers.push({ callback })
          }
          observe() {}
          disconnect() {}
        },
      )
      const { onLoadMore } = renderPage({ view: 'list', hasMoreRecords: true })

      act(() => observers[0].callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))

      expect(onLoadMore).toHaveBeenCalled()
    })
  })

  describe('불러오기 실패', () => {
    it('지도형: 오류 안내와 다시 시도 버튼을 보여준다', async () => {
      const { user, onRetry } = renderPage({ mapStatus: 'error', markers: [] })

      expect(screen.getByRole('alert')).toHaveTextContent('기록을 불러오지 못했어요')
      await user.click(screen.getByRole('button', { name: '다시 시도' }))

      expect(onRetry).toHaveBeenCalled()
    })

    it('목록형: 목록을 불러오지 못하면 오류 안내를 보여준다', () => {
      renderPage({ view: 'list', listStatus: 'error', records: [] })

      expect(screen.getByRole('alert')).toHaveTextContent('기록을 불러오지 못했어요')
    })
  })

  describe('하단 네비바', () => {
    it('기록 지도 탭이 선택되어 있고, 다른 탭으로 이동할 수 있다', async () => {
      const { user, onTabChange } = renderPage()

      expect(screen.getByRole('button', { name: '기록 지도' })).toHaveAttribute('aria-current', 'page')
      await user.click(screen.getByRole('button', { name: '홈' }))

      expect(onTabChange).toHaveBeenCalledWith('home')
    })
  })
})
