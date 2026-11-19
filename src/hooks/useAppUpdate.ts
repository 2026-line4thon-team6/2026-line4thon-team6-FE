import { useCallback, useEffect, useState } from 'react'

// 배포 빌드마다 vite.config.ts 가 dist/version.json 에 { buildId } 를 쓰고, 같은 값을 __BUILD_ID__ 로 코드에 넣는다
const VERSION_URL = '/version.json'
// 앱을 켜 둔 채로 있어도 이 간격마다 새 배포를 확인한다
const CHECK_INTERVAL_MS = 5 * 60 * 1000
// 닫은 빌드는 이번 세션 동안 다시 알리지 않는다
const DISMISSED_KEY = 'bbus.update.dismissed'

interface Options {
  currentBuildId?: string
  // 개발 서버에서는 확인하지 않는다
  enabled?: boolean
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

// 새 배포가 올라왔는지 확인한다. 시작할 때 · 화면으로 돌아올 때 · 5분마다
function useAppUpdate({ currentBuildId = __BUILD_ID__, enabled = !import.meta.env.DEV }: Options = {}) {
  const [latest, setLatest] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(readDismissed)

  useEffect(() => {
    if (!enabled) return
    let ignore = false

    const check = async () => {
      try {
        const response = await fetch(VERSION_URL, { cache: 'no-store' })
        if (!response.ok) return
        const { buildId } = (await response.json()) as { buildId?: unknown }
        if (!ignore && typeof buildId === 'string' && buildId) setLatest(buildId)
      } catch {
        // 오프라인 등으로 확인하지 못하면 다음 기회에 다시 본다
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void check()
    }

    void check()
    document.addEventListener('visibilitychange', handleVisibility)
    const timer = setInterval(() => void check(), CHECK_INTERVAL_MS)
    return () => {
      ignore = true
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(timer)
    }
  }, [enabled])

  const dismiss = useCallback(() => {
    if (!latest) return
    setDismissed(latest)
    try {
      sessionStorage.setItem(DISMISSED_KEY, latest)
    } catch {
      // 저장소를 못 쓰면 이번 화면에서만 닫힌다
    }
  }, [latest])

  const available = latest !== null && latest !== currentBuildId && latest !== dismissed
  return { available, dismiss }
}

export default useAppUpdate
