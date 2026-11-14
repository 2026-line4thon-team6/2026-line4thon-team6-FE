// 앱 화면은 손가락으로 확대 · 축소하지 않는다 (지도는 카카오맵이 터치를 직접 처리해 그대로 확대된다).
// 안드로이드 · 크롬은 viewport(user-scalable=no)와 touch-action으로 막히지만,
// iOS 사파리는 접근성 때문에 그 설정을 무시하고 핀치 확대를 허용한다. 사파리 전용 gesture 이벤트를 막아 확대를 끈다
const GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'] as const

const block = (event: Event) => event.preventDefault()

// 해제 함수를 돌려준다
export function preventPageZoom(target: Document = document) {
  for (const type of GESTURE_EVENTS) target.addEventListener(type, block, { passive: false })
  return () => {
    for (const type of GESTURE_EVENTS) target.removeEventListener(type, block)
  }
}
