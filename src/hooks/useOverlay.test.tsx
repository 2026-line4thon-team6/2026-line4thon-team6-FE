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
