import { useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import useDrive from '@/hooks/useDrive'
import useNotifications from '@/hooks/useNotifications'
import usePlaceDetail from '@/hooks/usePlaceDetail'
import useRouteSetting from '@/hooks/useRouteSetting'
import useStartDrive, { type DriveLocationState } from '@/hooks/useStartDrive'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import DrivePage from '@/pages/Drive/DrivePage'
import HomePage from '@/pages/Home/HomePage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import PlaceDetailPage from '@/pages/PlaceDetail/PlaceDetailPage'
import RouteSettingPage from '@/pages/RouteSetting/RouteSettingPage'
import type { HomeSummary } from '@/types/home'
import type { Notification } from '@/types/notification'
import { copyText, createIdempotencyKey, shareTo } from '@/utils/share'

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
  const navigate = useNavigate()
  const goBack = useGoBack()
  const goTab = useTabNavigate()
  const { markRead, retry, loadMore, ...list } = useNotifications()

  const handleClick = (notification: Notification) => {
    if (notification.readAt === null) {
      markRead(notification.id)
      onRead()
    }
    // 공유받은 장소는 상세 화면으로 이동한다. 카드 · 커플 화면은 아직 없어 이동하지 않는다
    if (notification.targetType === 'PLACE') {
      navigate(`/places/${encodeURIComponent(notification.targetId)}`)
    }
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

interface PlaceDetailRouteProps {
  placeId: string
  couple: HomeSummary['couple']
  mascotName: string
  onFavoriteChange: (placeId: string, favorite: boolean) => void
}

function PlaceDetailRoute({ placeId, couple, mascotName, onFavoriteChange }: PlaceDetailRouteProps) {
  const goBack = useGoBack()
  const drive = useStartDrive(couple)
  const { status, detail, retry, toggleFavorite, getShareUrl, sendToPartner } = usePlaceDetail(placeId)
  // 같은 전송 시도의 재시도에는 같은 멱등 키를 쓰고, 성공하면 새 키로 바꾼다
  const idempotencyKey = useRef<string | null>(null)

  const handleFavoriteToggle = async (favorite: boolean) => {
    const saved = await toggleFavorite(favorite)
    if (saved) onFavoriteChange(placeId, favorite)
  }

  const handleSend = async () => {
    if (!couple) return
    idempotencyKey.current ??= createIdempotencyKey()
    await sendToPartner({ idempotencyKey: idempotencyKey.current, coupleId: couple.id })
    idempotencyKey.current = null
  }

  return (
    <>
      <PlaceDetailPage
        status={status}
        detail={detail}
        partnerNickname={couple?.partnerNickname ?? null}
        onBack={goBack}
        onRetry={retry}
        onFavoriteToggle={handleFavoriteToggle}
        onStartDrive={() => void drive.start(placeId)}
        getShareUrl={getShareUrl}
        onCopyLink={(url) => void copyText(url)}
        onShareChannel={(channel, url) => void shareTo(channel, { url, title: detail?.place.name ?? '' })}
        onSendToPartner={handleSend}
        // TODO: 커플 코드 입력 화면이 생기면 이동한다
        onConnectRequired={() => {}}
      />
      <DriveNameSheet
        open={drive.sheetOpen}
        mode="create"
        mascotName={mascotName}
        onSubmit={(name) => void drive.submit(name)}
        onClose={drive.closeSheet}
      />
    </>
  )
}

// 진행 중인 드라이브가 없으면 홈으로 돌려보낸다
function DriveRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, drive, rename } = useDrive()

  if (status === 'empty') return <Navigate to="/" replace />

  return (
    <DrivePage
      status={status}
      drive={drive}
      onRename={rename}
      // 경로를 이미 정했으면 장소 상세에서 넘어온 목적지는 다시 쓰지 않는다
      onRouteSearch={() => navigate('/drive/route', { state: drive?.routeId ? null : location.state })}
    />
  )
}

function RouteSettingRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, setRoute } = useDrive()
  const { destinationPlaceId } = (location.state ?? {}) as DriveLocationState
  const routeSetting = useRouteSetting(destinationPlaceId)
  const [confirming, setConfirming] = useState(false)

  if (status === 'empty') return <Navigate to="/" replace />

  // /drive 에서 들어왔으면 방문 기록을 하나 되돌린다
  const backToDrive = () => (location.key === 'default' ? navigate('/drive', { replace: true }) : navigate(-1))

  const handleConfirm = async () => {
    if (!routeSetting.route) return
    setConfirming(true)
    const saved = await setRoute(routeSetting.route.id)
    setConfirming(false)
    // TODO: 실패 토스트
    if (saved) backToDrive()
  }

  return (
    <RouteSettingPage
      originAddress={routeSetting.origin?.address || null}
      locationUnavailable={routeSetting.locationStatus === 'unavailable'}
      query={routeSetting.query}
      history={routeSetting.history}
      results={routeSetting.results}
      route={routeSetting.route}
      routeStatus={routeSetting.routeStatus}
      confirming={confirming}
      onQueryChange={routeSetting.changeQuery}
      onSearch={routeSetting.submitSearch}
      onRecentSelect={routeSetting.selectRecent}
      onRecentDelete={routeSetting.deleteRecent}
      onResultSelect={routeSetting.selectPlace}
      onConfirm={() => void handleConfirm()}
      onClose={backToDrive}
    />
  )
}

// 장소가 바뀌면 상세 화면을 새로 마운트해 이전 장소의 상태가 남지 않게 한다
function PlaceDetailRouteByParam(props: Omit<PlaceDetailRouteProps, 'placeId'>) {
  const { placeId = '' } = useParams()
  return <PlaceDetailRoute key={placeId} placeId={placeId} {...props} />
}

// 홈 데이터는 API 연동 전까지 목 데이터를 쓴다 (GET /home 연동 시 교체)
function App() {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const [home, setHome] = useState(MOCK_HOME)
  const [spots, setSpots] = useState(MOCK_SPOTS)
  const drive = useStartDrive(home.couple)

  // 알림을 읽으면 홈의 새 알림 표시도 맞춘다. API 연동 후에는 홈을 다시 조회해 반영한다
  const handleNotificationRead = () =>
    setHome((prev) => ({ ...prev, unreadNotificationCount: Math.max(0, prev.unreadNotificationCount - 1) }))

  const setSpotLiked = (id: number, liked: boolean) =>
    setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <HomePage
              home={home}
              categories={MOCK_CATEGORIES}
              spots={spots}
              carConnected
              onNotificationClick={() => navigate('/notifications')}
              onSpotClick={(id) => navigate(`/places/${id}`)}
              onLikeToggle={setSpotLiked}
              onStartDrive={() => void drive.start()}
              onTabChange={goTab}
            />
            <DriveNameSheet
              open={drive.sheetOpen}
              mode="create"
              mascotName={home.mascotName}
              onSubmit={(name) => void drive.submit(name)}
              onClose={drive.closeSheet}
            />
          </>
        }
      />
      <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
      <Route path="/drive" element={<DriveRoute />} />
      <Route path="/drive/route" element={<RouteSettingRoute />} />
      <Route
        path="/places/:placeId"
        element={
          <PlaceDetailRouteByParam
            couple={home.couple}
            mascotName={home.mascotName}
            // 상세에서 바꾼 찜 상태를 홈 카드에도 반영한다 (목 장소 id는 홈 카드 id의 문자열)
            onFavoriteChange={(placeId, favorite) => setSpotLiked(Number(placeId), favorite)}
          />
        }
      />
    </Routes>
  )
}

export default App
