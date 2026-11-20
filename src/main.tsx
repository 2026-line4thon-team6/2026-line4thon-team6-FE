import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@/styles/global.scss'
import AppStart from './AppStart'
import { detectBackend } from '@/api/client'
import DeviceFrame from '@/components/DeviceFrame/DeviceFrame'
import { preventPageZoom } from '@/utils/preventPageZoom'
import { pwaInstall } from '@/utils/pwaInstall'
import { registerServiceWorker } from '@/utils/registerServiceWorker'
import { reloadOnStaleChunk } from '@/utils/reloadOnStaleChunk'

preventPageZoom()
// 설치 창 이벤트는 앱 시작 직후에 오므로 마이 화면을 열기 전부터 받아 둔다
pwaInstall.start()
registerServiceWorker()
// 페이지 코드는 열 때 받는다. 켜 둔 사이 새 배포가 올라가 예전 코드를 받지 못하면 새로고침한다
reloadOnStaleChunk()

// 스플래시는 바로 그리고, 서버가 떠 있는지 확인(최대 3초)하는 동안 붕붕이가 달린다.
// 확인이 끝나야 목 데이터를 쓸지 정해지므로 앱 화면은 그 뒤에 그린다
const backend = detectBackend()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceFrame>
      <AppStart backend={backend} />
    </DeviceFrame>
  </StrictMode>,
)
