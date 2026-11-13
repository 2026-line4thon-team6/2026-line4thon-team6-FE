import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createMockRecordMarkers } from '@/mocks/records'
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

// Figma 기록 지도(284:14400) Description 1~4 기준
type Props = ComponentProps<typeof RecordMapPage>
const MARKERS = createMockRecordMarkers()

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onSearch: vi.fn(),
    onCalendarClick: vi.fn(),
    onViewChange: vi.fn(),
    onMarkerClick: vi.fn(),
    onRetry: vi.fn(),
    onTabChange: vi.fn(),
  }
  render(<RecordMapPage status="ready" markers={MARKERS} totalCount={12} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('RecordMapPage', () => {
  describe('1. 드라이브 기록 현황', () => {
    it('함께한 드라이브 횟수와 제목을 보여준다', () => {
      renderPage({ totalCount: 12 })

      expect(screen.getByText('총 12번의 드라이브를 함께했어요')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: '우리 어디까지 가봤지?' })).toBeInTheDocument()
    })

    it('불러오는 중에는 횟수를 표시하지 않는다', () => {
      renderPage({ status: 'loading', markers: [], totalCount: 0 })

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
  })

  describe('3. 지도형 / 목록형 전환', () => {
    it('지도형이 선택되어 있고, 목록형을 누르면 전환을 요청한다', async () => {
      const { user, onViewChange } = renderPage()

      expect(screen.getByRole('button', { name: '지도형' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '목록형' })).toHaveAttribute('aria-pressed', 'false')

      await user.click(screen.getByRole('button', { name: '목록형' }))

      expect(onViewChange).toHaveBeenCalledWith('list')
    })
  })

  describe('4. 드라이브 기록 미리보기', () => {
    it('지도 위에 기록마다 사진 마커를 보여주고, 누르면 해당 기록을 알려준다', async () => {
      const { user, onMarkerClick } = renderPage()

      expect(screen.getAllByRole('button', { name: /기록 보기$/ })).toHaveLength(MARKERS.length)

      await user.click(screen.getByRole('button', { name: `${MARKERS[0].latestCard.title} 기록 보기` }))

      expect(onMarkerClick).toHaveBeenCalledWith(MARKERS[0])
    })
  })

  describe('불러오기 실패', () => {
    it('오류 안내와 다시 시도 버튼을 보여준다', async () => {
      const { user, onRetry } = renderPage({ status: 'error', markers: [], totalCount: 0 })

      expect(screen.getByRole('alert')).toHaveTextContent('기록을 불러오지 못했어요')
      await user.click(screen.getByRole('button', { name: '다시 시도' }))

      expect(onRetry).toHaveBeenCalled()
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
