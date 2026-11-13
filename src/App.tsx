import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import { logout } from '@/api/auth'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import useCoupleInvite from '@/hooks/useCoupleInvite'
import useCouplePage from '@/hooks/useCouplePage'
import useFavorites from '@/hooks/useFavorites'
import useLegalDocument from '@/hooks/useLegalDocument'
import useMyCouple from '@/hooks/useMyCouple'
import useNotifications from '@/hooks/useNotifications'
import usePlaceDetail from '@/hooks/usePlaceDetail'
import usePlaylistLibrary from '@/hooks/usePlaylistLibrary'
import useRadioStories from '@/hooks/useRadioStories'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import FavoritesPage from '@/pages/Archive/FavoritesPage'
import PlaylistsPage from '@/pages/Archive/PlaylistsPage'
import RadioStoriesPage from '@/pages/Archive/RadioStoriesPage'
import CouplePage from '@/pages/Couple/CouplePage'
import CoupleInvitePage from '@/pages/CoupleInvite/CoupleInvitePage'
import HomePage from '@/pages/Home/HomePage'
import LegalDocumentPage from '@/pages/LegalDocument/LegalDocumentPage'
import MyPage, { type MyMenu } from '@/pages/My/MyPage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import PlaceDetailPage from '@/pages/PlaceDetail/PlaceDetailPage'
import type { HomeSummary } from '@/types/home'
import type { LegalDocumentType } from '@/types/legal'
import type { Notification } from '@/types/notification'
import { copyText, createIdempotencyKey, shareInviteCode, shareTo } from '@/utils/share'

// 화면 주소. 기록 지도 화면은 아직 없어 탭을 눌러도 이동하지 않는다
const TAB_PATHS: Partial<Record<NavTab, string>> = {
  home: '/',
  my: '/my',
}

// 마이 화면 메뉴 → 문서 화면 주소
const LEGAL_PATHS: Record<LegalDocumentType, string> = {
  PRIVACY: '/my/privacy',
  TERMS: '/my/terms',
  OPEN_SOURCE: '/my/open-source',
}

const LEGAL_MENUS: Partial<Record<MyMenu, LegalDocumentType>> = {
  privacy: 'PRIVACY',
  terms: 'TERMS',
  openSource: 'OPEN_SOURCE',
}

// 마이 화면 메뉴 → 보관함 화면 주소
const ARCHIVE_PATHS: Partial<Record<MyMenu, string>> = {
  favorites: '/my/favorites',
  playlists: '/my/playlists',
  stories: '/my/stories',
}

function useTabNavigate() {
  const navigate = useNavigate()
  return (tab: NavTab) => {
    const path = TAB_PATHS[tab]
    if (path) navigate(path)
  }
}

// 앱 안에서 들어왔으면 이전 화면으로, 주소로 바로 들어왔으면 fallback(기본 홈)으로 돌아간다
function useGoBack(fallback = '/') {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
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
  onFavoriteChange: (placeId: string, favorite: boolean) => void
}

function PlaceDetailRoute({ placeId, couple, onFavoriteChange }: PlaceDetailRouteProps) {
  const navigate = useNavigate()
  const goBack = useGoBack()
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
    <PlaceDetailPage
      status={status}
      detail={detail}
      partnerNickname={couple?.partnerNickname ?? null}
      onBack={goBack}
      onRetry={retry}
      onFavoriteToggle={handleFavoriteToggle}
      // TODO: 드라이브 모드 화면이 생기면 이 장소를 목적지로 이동한다
      onStartDrive={() => {}}
      getShareUrl={getShareUrl}
      onCopyLink={(url) => void copyText(url)}
      onShareChannel={(channel, url) => void shareTo(channel, { url, title: detail?.place.name ?? '' })}
      onSendToPartner={handleSend}
      onConnectRequired={() => navigate('/couple/invite')}
    />
  )
}

// 장소가 바뀌면 상세 화면을 새로 마운트해 이전 장소의 상태가 남지 않게 한다
function PlaceDetailRouteByParam(props: Omit<PlaceDetailRouteProps, 'placeId'>) {
  const { placeId = '' } = useParams()
  return <PlaceDetailRoute key={placeId} placeId={placeId} {...props} />
}

// 마이 화면에 들어올 때마다 커플 요약을 새로 불러온다
function MyRoute() {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const { status, couple } = useMyCouple()

  const handleMenuClick = (menu: MyMenu) => {
    const legal = LEGAL_MENUS[menu]
    const path = legal ? LEGAL_PATHS[legal] : ARCHIVE_PATHS[menu]
    if (path) navigate(path)
    // TODO: FAQ 화면이 생기면 이동한다
  }

  // TODO: 로그인 화면이 생기면 로그인 화면으로 보낸다. 지금은 세션이 없어 홈으로 이동한다
  const handleLogout = async () => {
    await logout(createIdempotencyKey()).catch(() => undefined)
    navigate('/', { replace: true })
  }

  return (
    <MyPage
      status={status}
      couple={couple}
      // 연결 전이면 커플 페이지 대신 연인 초대 화면으로 보낸다
      onProfileClick={() => navigate(status === 'ready' && !couple ? '/couple/invite' : '/my/couple')}
      onMenuClick={handleMenuClick}
      onLogout={() => void handleLogout()}
      onTabChange={goTab}
    />
  )
}

// 커플 페이지. 연결을 해제하면 마이 화면으로 돌아간다 (기능명세서: 해제 후 이동 화면 확인 필요)
function CoupleRoute() {
  const navigate = useNavigate()
  const goBack = useGoBack('/my')
  const { retry, changeStartDate, renameMascot, updateProfile, disconnect, ...state } = useCouplePage()

  return (
    <CouplePage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onChangeStartDate={changeStartDate}
      onRenameMascot={renameMascot}
      onUpdateProfile={updateProfile}
      onCopyInviteCode={(code) => copyText(code).catch(() => undefined)}
      onDisconnect={disconnect}
      onDisconnected={() => navigate('/my', { replace: true })}
    />
  )
}

interface FavoritesRouteProps {
  onFavoriteChange: (placeId: string, favorite: boolean) => void
}

// 찜한 드라이브 코스. 찜을 취소하면 홈 카드의 하트에도 반영한다
function FavoritesRoute({ onFavoriteChange }: FavoritesRouteProps) {
  const navigate = useNavigate()
  const goBack = useGoBack('/my')
  const { status, places, category, selectCategory, toggleFavorite, retry } = useFavorites()

  const handleFavoriteToggle = async (placeId: string, favorite: boolean) => {
    if (await toggleFavorite(placeId, favorite)) onFavoriteChange(placeId, favorite)
  }

  return (
    <FavoritesPage
      status={status}
      places={places}
      category={category}
      onBack={goBack}
      onRetry={retry}
      onSelectCategory={selectCategory}
      onFavoriteToggle={(placeId, favorite) => void handleFavoriteToggle(placeId, favorite)}
      onPlaceClick={(placeId) => navigate(`/places/${encodeURIComponent(placeId)}`)}
    />
  )
}

function PlaylistsRoute() {
  const goBack = useGoBack('/my')
  const { retry, ...state } = usePlaylistLibrary()

  // TODO: 플레이리스트 상세 화면이 생기면 이동한다
  return <PlaylistsPage {...state} onBack={goBack} onRetry={retry} onPlaylistClick={() => {}} />
}

function RadioStoriesRoute() {
  const goBack = useGoBack('/my')
  const { setQuery, retry, ...state } = useRadioStories()

  // TODO: 라디오 사연 상세(방송 문구 · 다시 듣기) 화면이 생기면 이동한다
  return (
    <RadioStoriesPage {...state} onBack={goBack} onRetry={retry} onQueryChange={setQuery} onStoryClick={() => {}} />
  )
}

// 연인 초대 · 코드 연결. 연결하거나 건너뛰면 메인 홈으로 간다 (기능명세서 L9)
function CoupleInviteRoute() {
  const navigate = useNavigate()
  const goBack = useGoBack('/')
  const { retry, connect, ...state } = useCoupleInvite()
  const goHome = () => navigate('/', { replace: true })

  return (
    <CoupleInvitePage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onCopy={(code) => copyText(code).catch(() => undefined)}
      onShare={shareInviteCode}
      onConnect={connect}
      onConnected={goHome}
      onSkip={goHome}
    />
  )
}

function LegalDocumentRoute({ type }: { type: LegalDocumentType }) {
  const goBack = useGoBack('/my')
  const { status, document, retry } = useLegalDocument(type)

  return <LegalDocumentPage type={type} status={status} document={document} onBack={goBack} onRetry={retry} />
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

  const setSpotLiked = (id: number, liked: boolean) =>
    setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))

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
            onSpotClick={(id) => navigate(`/places/${id}`)}
            onLikeToggle={setSpotLiked}
            onTabChange={goTab}
          />
        }
      />
      <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
      <Route path="/my" element={<MyRoute />} />
      <Route path="/my/couple" element={<CoupleRoute />} />
      <Route path="/couple/invite" element={<CoupleInviteRoute />} />
      <Route
        path="/my/favorites"
        element={<FavoritesRoute onFavoriteChange={(placeId, favorite) => setSpotLiked(Number(placeId), favorite)} />}
      />
      <Route path="/my/playlists" element={<PlaylistsRoute />} />
      <Route path="/my/stories" element={<RadioStoriesRoute />} />
      {Object.entries(LEGAL_PATHS).map(([type, path]) => (
        <Route
          key={type}
          path={path}
          element={<LegalDocumentRoute key={type} type={type as LegalDocumentType} />}
        />
      ))}
      <Route
        path="/places/:placeId"
        element={
          <PlaceDetailRouteByParam
            couple={home.couple}
            // 상세에서 바꾼 찜 상태를 홈 카드에도 반영한다 (목 장소 id는 홈 카드 id의 문자열)
            onFavoriteChange={(placeId, favorite) => setSpotLiked(Number(placeId), favorite)}
          />
        }
      />
    </Routes>
  )
}

export default App
