import { useState } from 'react'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import HomePage from '@/pages/Home/HomePage'

// 라우터·API 연동 전까지는 목 데이터로 홈 화면만 보여준다
function App() {
  const [spots, setSpots] = useState(MOCK_SPOTS)

  return (
    <HomePage
      home={MOCK_HOME}
      categories={MOCK_CATEGORIES}
      spots={spots}
      carConnected
      onLikeToggle={(id, liked) =>
        setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))
      }
    />
  )
}

export default App
