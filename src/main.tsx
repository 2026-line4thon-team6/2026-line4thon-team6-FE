import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@/styles/global.scss'
import App from './App.tsx'
import { preventPageZoom } from '@/utils/preventPageZoom'
import { pwaInstall } from '@/utils/pwaInstall'
import { registerServiceWorker } from '@/utils/registerServiceWorker'

preventPageZoom()
// 설치 창 이벤트는 앱 시작 직후에 오므로 마이 화면을 열기 전부터 받아 둔다
pwaInstall.start()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
