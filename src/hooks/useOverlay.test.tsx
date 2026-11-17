import { render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import useOverlay from './useOverlay'

function Overlay() {
  const ref = useOverlay<HTMLDivElement>(vi.fn())
  return <div ref={ref} tabIndex={-1} />
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

it('열려 있는 동안 화면과 데스크톱 프레임 화면의 스크롤을 잠그고, 닫으면 되돌린다', () => {
  const scrollRoot = document.createElement('div')
  scrollRoot.setAttribute('data-scroll-root', '')
  document.body.appendChild(scrollRoot)

  const { unmount } = render(<Overlay />, { container: scrollRoot.appendChild(document.createElement('div')) })

  expect(document.body.style.overflow).toBe('hidden')
  expect(scrollRoot.style.overflow).toBe('hidden')

  unmount()

  expect(document.body.style.overflow).toBe('')
  expect(scrollRoot.style.overflow).toBe('')
})

// 시트가 화면 아래에서 올라오는 중에 포커스를 옮기면 브라우저가 그쪽으로 화면을 스크롤해 화면 전체가 들썩인다
it('열릴 때 · 닫힐 때 포커스를 옮겨도 화면을 스크롤하지 않는다', () => {
  const trigger = document.body.appendChild(document.createElement('button'))
  trigger.focus()
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')

  const { unmount } = render(<Overlay />)
  expect(focus).toHaveBeenLastCalledWith({ preventScroll: true })

  unmount()
  expect(focus).toHaveBeenLastCalledWith({ preventScroll: true })
  expect(document.activeElement).toBe(trigger)
  focus.mockRestore()
})
