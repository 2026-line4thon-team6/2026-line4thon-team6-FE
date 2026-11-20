// 마지막으로 새로고침한 시각. 새로고침해도 남도록 sessionStorage에 둔다
const STORAGE_KEY = 'bbus-stale-chunk-reload'
// 새로고침한 뒤 이 시간 안에 또 실패하면 새 배포 문제가 아니라(오프라인 등) 다시 새로고침하지 않는다
const RETRY_GAP_MS = 10_000

interface Options {
  reload?: () => void
  now?: () => number
}

function readLastReload() {
  try {
    return Number(sessionStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

function writeLastReload(time: number) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(time))
  } catch {
    // 저장하지 못해도 새로고침은 한다
  }
}

// 앱을 켜 둔 채 새 배포가 올라가면, 아직 열지 않은 페이지 코드(예전 배포의 파일 이름)를 받지 못한다.
// Vite가 보내는 vite:preloadError를 받으면 한 번 새로고침해 새 배포의 코드를 받는다. 해제 함수를 돌려준다
export function reloadOnStaleChunk({ reload = () => window.location.reload(), now = Date.now }: Options = {}) {
  const handle = (event: Event) => {
    const time = now()
    if (time - readLastReload() < RETRY_GAP_MS) return
    writeLastReload(time)
    event.preventDefault()
    reload()
  }

  window.addEventListener('vite:preloadError', handle)
  return () => window.removeEventListener('vite:preloadError', handle)
}
