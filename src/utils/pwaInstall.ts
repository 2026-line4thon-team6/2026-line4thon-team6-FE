// 앱 설치(PWA) 상태. 마이 화면의 '앱 설치하기'가 쓴다.
// 크롬 · 삼성 인터넷 · 엣지는 설치 창 이벤트(beforeinstallprompt)를 앱 시작 직후 한 번 보내므로, 앱이 뜰 때부터 받아 둔다.
// iOS(사파리 · iOS 크롬)는 설치 창을 띄울 방법이 없어 '공유 → 홈 화면에 추가'를 안내한다

// 'prompt': 설치 창을 바로 띄울 수 있음 · 'ios': 공유 메뉴 안내 · 'manual': 브라우저 메뉴 안내 · null: 이미 앱으로 실행 중
export type InstallMode = 'prompt' | 'ios' | 'manual' | null
export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Device = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>

// iPadOS 13+ 사파리는 맥과 같은 UA를 쓰므로 터치 지원 여부로 구분한다
function isIos({ userAgent, platform, maxTouchPoints }: Device) {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

// 홈 화면 아이콘으로 실행했는지 (iOS는 navigator.standalone)
function isStandaloneWindow() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

interface Options {
  target?: Window
  device?: Device
  isStandalone?: () => boolean
}

export function createPwaInstall({ target = window, device = navigator, isStandalone = isStandaloneWindow }: Options = {}) {
  let deferred: InstallPromptEvent | null = null
  let installed = false
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  const handlePrompt = (event: Event) => {
    event.preventDefault() // 브라우저 기본 설치 배너 대신 마이 화면 메뉴로 설치한다
    deferred = event as InstallPromptEvent
    notify()
  }
  const handleInstalled = () => {
    installed = true
    deferred = null
    notify()
  }

  // 마이 화면이 그리는 값. 바뀔 때만 새 값을 돌려준다 (useSyncExternalStore)
  const getMode = (): InstallMode => {
    if (installed || isStandalone()) return null
    if (deferred) return 'prompt'
    return isIos(device) ? 'ios' : 'manual'
  }

  return {
    // 이벤트 받기 시작. 해제 함수를 돌려준다
    start() {
      target.addEventListener('beforeinstallprompt', handlePrompt)
      target.addEventListener('appinstalled', handleInstalled)
      return () => {
        target.removeEventListener('beforeinstallprompt', handlePrompt)
        target.removeEventListener('appinstalled', handleInstalled)
      }
    },
    getMode,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    // 설치 창을 띄운다. 설치 창 이벤트는 한 번만 쓸 수 있다
    async prompt(): Promise<InstallOutcome> {
      const event = deferred
      if (!event) return 'unavailable'
      deferred = null
      await event.prompt()
      const { outcome } = await event.userChoice
      notify()
      return outcome
    },
  }
}

// 앱 전체에서 하나만 쓴다 (main.tsx에서 시작)
export const pwaInstall = createPwaInstall()
