import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router'
import App from './App'
import Splash from '@/components/Splash/Splash'
import { shouldShowSplash } from '@/components/Splash/splashMotion'

interface AppStartProps {
  // 서버가 떠 있는지 확인하는 작업 (detectBackend). 끝나야 목 데이터를 쓸지 정해져 앱을 그릴 수 있다
  backend: Promise<void>
}

// 앱을 열면 스플래시를 먼저 띄우고, 서버 확인이 끝나면 그 뒤에 앱 화면을 그려 둔다.
// 스플래시가 끝나면 걷혀서 로그인(또는 홈) 화면이 드러난다
function AppStart({ backend }: AppStartProps) {
  const [ready, setReady] = useState(false)
  const [splash, setSplash] = useState(() => shouldShowSplash(window.location.pathname))

  useEffect(() => {
    let alive = true
    void backend.then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [backend])

  return (
    <>
      {ready && (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
      {splash && <Splash ready={ready} onDone={() => setSplash(false)} />}
    </>
  )
}

export default AppStart
