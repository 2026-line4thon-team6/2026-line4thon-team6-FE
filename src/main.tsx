import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@/styles/global.scss'
import App from './App.tsx'
import { preventIosInputZoom } from '@/utils/preventIosInputZoom'

preventIosInputZoom()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
