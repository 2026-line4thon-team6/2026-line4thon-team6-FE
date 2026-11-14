import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getDeviceScale } from '@/utils/deviceScale'
import DeviceFrame from './DeviceFrame'

// 데스크톱에서 앱을 아이폰 16 모양 프레임 안에 띄운다 (모바일에서는 프레임이 사라진다 · CSS)
describe('DeviceFrame', () => {
  it('앱을 화면 영역 안에 그리고, 기기 장식은 스크린 리더에서 숨긴다', () => {
    const { container } = render(
      <DeviceFrame>
        <button type="button">앱 버튼</button>
      </DeviceFrame>,
    )

    const app = screen.getByRole('button', { name: '앱 버튼' })
    // 팝업이 열릴 때 스크롤을 잠그는 대상 (데스크톱에서는 프레임 화면이 스크롤된다)
    expect(app.closest('[data-scroll-root]')).not.toBeNull()
    for (const deco of container.querySelectorAll('[data-device-deco]')) {
      expect(deco).toHaveAttribute('aria-hidden', 'true')
    }
  })
})

describe('getDeviceScale', () => {
  it.each([
    [1080, 1],
    [928, 1], // 프레임 880 + 위아래 여백 24씩
    [700, 652 / 880],
    [300, 0.5], // 너무 작아지지 않게 절반에서 멈춘다
  ])('창 높이 %ipx → 배율 %f', (height, expected) => {
    expect(getDeviceScale(height)).toBeCloseTo(expected)
  })
})
