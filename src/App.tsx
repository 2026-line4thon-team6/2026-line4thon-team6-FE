import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import HomePage from '@/pages/Home/HomePage'

// 화면 주소. 기록 지도 · 마이 화면은 아직 없어 탭을 눌러도 이동하지 않는다
const TAB_PATHS: Partial<Record<NavTab, string>> = {
  home: '/',
}

function useTabNavigate() {
  const navigate = useNavigate()
  return (tab: NavTab) => {
    const path = TAB_PATHS[tab]
    if (path) navigate(path)
  }
}

// 홈 데이터는 API 연동 전까지 목 데이터를 쓴다 (GET /home 연동 시 교체)
function App() {
  const goTab = useTabNavigate()
  const [spots, setSpots] = useState(MOCK_SPOTS)

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            home={MOCK_HOME}
            categories={MOCK_CATEGORIES}
            spots={spots}
            carConnected
            onLikeToggle={(id, liked) =>
              setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))
            }
            onTabChange={goTab}
          />
        }
      />
    </Routes>
  )
}

export default App
