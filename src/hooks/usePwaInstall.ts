import { useSyncExternalStore } from 'react'
import { pwaInstall } from '@/utils/pwaInstall'

// 마이 화면 '앱 설치하기'의 상태와 설치 요청
function usePwaInstall() {
  const mode = useSyncExternalStore(pwaInstall.subscribe, pwaInstall.getMode, () => null)
  const install = () => void pwaInstall.prompt()
  return { mode, install }
}

export default usePwaInstall
