import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import RouteSettingPage from './RouteSettingPage'

// 카카오 지도 SDK는 jsdom에서 동작하지 않는다
vi.mock('@/components/DriveMap/DriveMap', () => ({ default: () => <div data-testid="drive-map" /> }))

type Props = ComponentProps<typeof RouteSettingPage>

function renderPage(props: Partial<Props> = {}) {
  render(
    <RouteSettingPage
      originAddress="서울 서초구 서초동"
      query=""
      history={[]}
      results={null}
      route={null}
      routeStatus="idle"
      onQueryChange={vi.fn()}
      onSearch={vi.fn()}
      onRecentSelect={vi.fn()}
      onRecentDelete={vi.fn()}
      onResultSelect={vi.fn()}
      onConfirm={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  )
}

describe('경로 설정 화면', () => {
  it('현재 위치를 못 받으면 위치 권한 안내를 보여준다', () => {
    renderPage({ originAddress: null, locationUnavailable: true })

    expect(screen.getByRole('alert')).toHaveTextContent('위치 권한을 허용해 주세요.')
  })

  it('경로를 계산하는 동안 안내를 보여준다', () => {
    renderPage({ query: '서울 반포 한강공원', routeStatus: 'loading' })

    expect(screen.getByRole('status')).toHaveTextContent('경로를 찾는 중이에요.')
  })
})
