import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import useNotifications from '@/hooks/useNotifications'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import HomePage from '@/pages/Home/HomePage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import type { Notification } from '@/types/notification'

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

// 앱 안에서 들어왔으면 이전 화면으로, 주소로 바로 들어왔으면 홈으로 돌아간다
function useGoBack() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate('/') : navigate(-1))
}

interface NotificationsRouteProps {
  onRead: () => void
}

// 알림 화면에 들어올 때마다 목록을 새로 불러온다
function NotificationsRoute({ onRead }: NotificationsRouteProps) {
  const goBack = useGoBack()
  const goTab = useTabNavigate()
  const { markRead, retry, loadMore, ...list } = useNotifications()

  const handleClick = (notification: Notification) => {
    if (notification.readAt === null) {
      markRead(notification.id)
      onRead()
    }
    // TODO: 대상 화면이 생기면 targetType · targetId로 이동한다 (PLACE → 장소 상세)
  }

  return (
    <NotificationsPage
      {...list}
      onBack={goBack}
      onNotificationClick={handleClick}
      onRetry={retry}
      onLoadMore={loadMore}
      onTabChange={goTab}
    />
  )
}

// 홈 데이터는 API 연동 전까지 목 데이터를 쓴다 (GET /home 연동 시 교체)
function App() {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const [home, setHome] = useState(MOCK_HOME)
  const [spots, setSpots] = useState(MOCK_SPOTS)

  // 알림을 읽으면 홈의 새 알림 표시도 맞춘다. API 연동 후에는 홈을 다시 조회해 반영한다
  const handleNotificationRead = () =>
    setHome((prev) => ({ ...prev, unreadNotificationCount: Math.max(0, prev.unreadNotificationCount - 1) }))

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            home={home}
            categories={MOCK_CATEGORIES}
            spots={spots}
            carConnected
            onNotificationClick={() => navigate('/notifications')}
            onLikeToggle={(id, liked) =>
              setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))
            }
            onTabChange={goTab}
          />
        }
      />
      <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
    </Routes>
  )
}

export default App
