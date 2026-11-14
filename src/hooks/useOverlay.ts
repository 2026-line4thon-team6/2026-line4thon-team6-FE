import { useEffect, useRef } from 'react'

// 바텀시트 · 팝업 공통 동작: Esc로 닫기, 뒤 화면 스크롤 잠금, 열릴 때 포커스 이동과 닫힐 때 복귀
function useOverlay<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previousFocus = document.activeElement
    // 모바일은 문서가, 데스크톱 기기 프레임은 프레임 화면이 스크롤되므로 둘 다 잠근다
    const scrollers = [document.body, document.querySelector<HTMLElement>('[data-scroll-root]')].filter(
      (element): element is HTMLElement => element !== null,
    )
    const previousOverflows = scrollers.map((element) => element.style.overflow)
    scrollers.forEach((element) => (element.style.overflow = 'hidden'))
    // 시트 안 입력창에 autoFocus가 있으면 그 포커스를 유지하고, 없을 때만 시트로 옮긴다
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      scrollers.forEach((element, index) => (element.style.overflow = previousOverflows[index] ?? ''))
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return ref
}

export default useOverlay
