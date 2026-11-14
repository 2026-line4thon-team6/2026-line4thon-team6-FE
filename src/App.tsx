import { useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import { fetchCardShare } from '@/api/cards'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import useAuth, { type Auth } from '@/hooks/useAuth'
import useCoupleInvite from '@/hooks/useCoupleInvite'
import useCouplePage from '@/hooks/useCouplePage'
import useFavorites from '@/hooks/useFavorites'
import useLegalDocument from '@/hooks/useLegalDocument'
import useMyCouple from '@/hooks/useMyCouple'
import CardPromptModal from '@/components/CardPromptModal/CardPromptModal'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import useCardDetail from '@/hooks/useCardDetail'
import useDrive from '@/hooks/useDrive'
import useDriveCard from '@/hooks/useDriveCard'
import useNotifications from '@/hooks/useNotifications'
import usePendingCards from '@/hooks/usePendingCards'
import usePlaceDetail from '@/hooks/usePlaceDetail'
import usePlaylistLibrary from '@/hooks/usePlaylistLibrary'
import useRadioStories from '@/hooks/useRadioStories'
import useRecordMap from '@/hooks/useRecordMap'
import useRecords from '@/hooks/useRecords'
import useRouteSetting from '@/hooks/useRouteSetting'
import useStartDrive, { type DriveLocationState } from '@/hooks/useStartDrive'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import FavoritesPage from '@/pages/Archive/FavoritesPage'
import PlaylistsPage from '@/pages/Archive/PlaylistsPage'
import RadioStoriesPage from '@/pages/Archive/RadioStoriesPage'
import CouplePage from '@/pages/Couple/CouplePage'
import CoupleInvitePage from '@/pages/CoupleInvite/CoupleInvitePage'
import DrivePage from '@/pages/Drive/DrivePage'
import DriveCardPage from '@/pages/DriveCard/DriveCardPage'
import HomePage from '@/pages/Home/HomePage'
import LegalDocumentPage from '@/pages/LegalDocument/LegalDocumentPage'
import MyPage, { type MyMenu } from '@/pages/My/MyPage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import PlaceDetailPage from '@/pages/PlaceDetail/PlaceDetailPage'
import RecordDetailPage from '@/pages/RecordDetail/RecordDetailPage'
import RecordCalendarSheet from '@/pages/RecordMap/RecordCalendarSheet'
import RecordMapPage, { type RecordView } from '@/pages/RecordMap/RecordMapPage'
import RecordShareSheet from '@/pages/RecordMap/RecordShareSheet'
import RouteSettingPage from '@/pages/RouteSetting/RouteSettingPage'
import {
  AnniversaryStep,
  BirthdayStep,
  GenderStep,
  IntroStep,
  LoginRoute,
  MascotStep,
  MemberGate,
  NicknameStep,
  OAuthCallbackRoute,
  OnboardingFlow,
  WelcomeStep,
} from '@/routes/AuthRoutes'
import { LOGIN_PATH } from '@/routes/paths'
import type { HomeSummary } from '@/types/home'
import type { LegalDocumentType } from '@/types/legal'
import type { Notification } from '@/types/notification'
import type { RecordSummary } from '@/types/record'
import type { Category, SpotSummary } from '@/types/spot'
import { todayInSeoul } from '@/utils/calendar'
import { formatDate } from '@/utils/formatDate'
import { copyText, createIdempotencyKey, type ShareChannel, shareInviteCode, type ShareLink, shareTo } from '@/utils/share'
import { shareStory } from '@/utils/storyImage'

// 화면 주소
const TAB_PATHS: Partial<Record<NavTab, string>> = {
  home: '/',
  map: '/map',
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
  mascotName: string
  onFavoriteChange: (placeId: string, favorite: boolean) => void
}

function PlaceDetailRoute({ placeId, couple, mascotName, onFavoriteChange }: PlaceDetailRouteProps) {
  const navigate = useNavigate()
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
        onConnectRequired={() => navigate('/couple/invite')}
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

// 기록 지도. 검색어나 날짜가 바뀌면 지도 마커와 기록 목록을 그 조건으로 다시 불러온다.
// 검색어와 날짜는 함께 쓰지 않는다. 상단의 '총 N번'은 조건과 관계없는 목록 API의 totalCount를 쓴다
function RecordMapRoute() {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const [view, setView] = useState<RecordView>('map')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  // 공유 중인 기록 카드와 그 카드의 커플 전용 링크
  const [sharing, setSharing] = useState<{ card: RecordSummary; link: ShareLink } | null>(null)
  const filter = date ? { date } : { q: query }
  const map = useRecordMap(filter)
  const list = useRecords(filter)

  const handleSearch = (nextQuery: string) => {
    setQuery(nextQuery)
    setDate(null)
  }

  const handleShare = (card: RecordSummary) => {
    setSharing({ card, link: { status: 'loading' } })
    // 링크를 받는 사이 다른 카드를 공유하기 시작했으면 늦은 응답은 버린다
    const update = (link: ShareLink) => setSharing((prev) => (prev?.card.cardId === card.cardId ? { card, link } : prev))
    fetchCardShare(card.cardId)
      .then(({ data }) => update({ status: 'ready', url: data.url }))
      .catch(() => update({ status: 'error' }))
  }

  // 인스타그램은 카드를 스토리 이미지(기록 지도 배경 + 카드)로 만들어 넘기고, 이미지 공유를 지원하지 않는 기기에서는 링크로 공유한다
  const handleShareChannel = async (card: RecordSummary, channel: ShareChannel, url: string) => {
    if (channel === 'instagram') {
      const result = await shareStory({
        photoUrl: card.thumbnailUrl,
        title: card.title,
        date: formatDate(card.driveDate),
        // 스토리 배경에 지금 기록 지도의 사진 마커를 함께 그린다
        markers: map.markers.map(({ coordinate, latestCard }) => ({ ...coordinate, photoUrl: latestCard.thumbnailUrl })),
      })
      if (result !== 'unsupported') return
    }
    await shareTo(channel, { url, title: card.title })
  }

  const handleDateSelect = (nextDate: string) => {
    setDate(nextDate)
    setQuery('')
    setCalendarOpen(false)
  }

  const retry = () => {
    if (map.status === 'error') map.retry()
    if (list.status === 'error') list.retry()
  }

  return (
    <>
      <RecordMapPage
        view={view}
        totalCount={list.totalCount}
        date={date}
        mapStatus={map.status}
        markers={map.markers}
        listStatus={list.status}
        records={list.records}
        hasMoreRecords={list.hasMore}
        onSearch={handleSearch}
        onViewChange={setView}
        onLoadMore={() => void list.loadMore()}
        onRetry={retry}
        onTabChange={goTab}
        onCalendarClick={() => setCalendarOpen(true)}
        onDateClear={() => setDate(null)}
        onCardClick={(card) => navigate(`/cards/${encodeURIComponent(card.cardId)}`)}
        onShare={handleShare}
      />
      {sharing && (
        <RecordShareSheet
          card={sharing.card}
          link={sharing.link}
          onClose={() => setSharing(null)}
          onCopyLink={(url) => void copyText(url)}
          onShareChannel={(channel, url) => void handleShareChannel(sharing.card, channel, url)}
        />
      )}
      {calendarOpen && (
        <RecordCalendarSheet
          selectedDate={date}
          today={todayInSeoul()}
          onSelect={handleDateSelect}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  )
}

// 기록 상세. 삭제하면 이전 화면(기록 지도)으로 돌아가고, 기록 지도는 다시 불러와 지운 기록이 빠진다
function RecordDetailRoute({ cardId }: { cardId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = useGoBack()
  const { status, card, retry, remove } = useCardDetail(cardId)

  const handleDelete = async () => {
    const outcome = await remove()
    if (outcome === 'deleted') {
      if (location.key === 'default') navigate('/map', { replace: true })
      else navigate(-1)
    }
    return outcome
  }

  // 기능명세서 18: 도착 후 24시간 안(canEdit)이면 상세 대신 작성 화면에서 고친다.
  // 뒤로가기로 상세에 다시 오지 않게 기록을 바꾼다
  if (card?.canEdit) return <Navigate to={cardPath(card.driveId)} replace />

  return (
    <RecordDetailPage
      status={status}
      card={card}
      onBack={goBack}
      onRetry={retry}
      onDelete={handleDelete}
      // TODO: 플레이리스트 화면이 생기면 연결한다
    />
  )
}

function RecordDetailRouteByParam() {
  const { cardId = '' } = useParams()
  return <RecordDetailRoute key={cardId} cardId={cardId} />
}

// 장소가 바뀌면 상세 화면을 새로 마운트해 이전 장소의 상태가 남지 않게 한다
function PlaceDetailRouteByParam(props: Omit<PlaceDetailRouteProps, 'placeId'>) {
  const { placeId = '' } = useParams()
  return <PlaceDetailRoute key={placeId} placeId={placeId} {...props} />
}

// 마이 화면에 들어올 때마다 커플 요약을 새로 불러온다
function MyRoute({ auth }: { auth: Auth }) {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const { status, couple } = useMyCouple()

  const handleMenuClick = (menu: MyMenu) => {
    const legal = LEGAL_MENUS[menu]
    const path = legal ? LEGAL_PATHS[legal] : ARCHIVE_PATHS[menu]
    if (path) navigate(path)
    // TODO: FAQ 화면이 생기면 이동한다
  }

  // 로그아웃하면 로그인 화면(L1)으로 간다
  const handleLogout = async () => {
    await auth.signOut()
    navigate(LOGIN_PATH, { replace: true })
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

const cardPath = (driveId: string) => `/drives/${encodeURIComponent(driveId)}/card`

interface HomeRouteProps {
  home: HomeSummary
  categories: Category[]
  spots: SpotSummary[]
  // 미작성 카드 팝업은 앱을 켠 뒤 한 번만 띄운다. 이후에는 배너로만 알린다
  pendingPromptSeen: boolean
  onPendingPromptSeen: () => void
  onLikeToggle: (id: number, liked: boolean) => void
}

// 홈에 들어올 때마다 미작성 카드를 새로 불러온다
function HomeRoute({ home, categories, spots, pendingPromptSeen, onPendingPromptSeen, onLikeToggle }: HomeRouteProps) {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const { summary } = usePendingCards()
  const drive = useStartDrive(home.couple)

  const goCard = (driveId: string) => {
    onPendingPromptSeen()
    navigate(cardPath(driveId))
  }

  return (
    <>
      <HomePage
        home={home}
        categories={categories}
        spots={spots}
        carConnected
        pendingCard={summary}
        onNotificationClick={() => navigate('/notifications')}
        onSpotClick={(id) => navigate(`/places/${id}`)}
        onLikeToggle={onLikeToggle}
        onStartDrive={() => void drive.start()}
        onTabChange={goTab}
        onPendingCardClick={goCard}
      />
      <DriveNameSheet
        open={drive.sheetOpen}
        mode="create"
        mascotName={home.mascotName}
        onSubmit={(name) => void drive.submit(name)}
        onClose={drive.closeSheet}
      />
      {summary && !pendingPromptSeen && (
        <CardPromptModal
          variant="pending"
          remainingSeconds={summary.remainingSeconds}
          onConfirm={() => goCard(summary.driveId)}
          onClose={onPendingPromptSeen}
        />
      )}
    </>
  )
}

interface DriveCardRouteProps {
  driveId: string
  userId: string
}

function DriveCardRoute({ driveId, userId }: DriveCardRouteProps) {
  const navigate = useNavigate()
  const goBack = useGoBack()
  const { setMyText, save, saveDraft, retry, addPhotos, removePhoto, swapPhotos, ...card } = useDriveCard(
    driveId,
    userId,
  )

  // 저장하면 홈으로 돌아간다. 뒤로가기로 카드 화면에 다시 오지 않게 기록을 바꾼다
  // TODO: 드라이브 카드 상세 화면이 생기면 저장한 카드 상세로 이동한다
  const handleSave = async () => {
    if (await save()) navigate('/', { replace: true })
  }

  // 나갈 때 쓰던 소감은 초안으로 남겨 둔다 (24시간 안에 배너로 다시 들어올 수 있다)
  const handleLeave = async () => {
    await saveDraft()
    goBack()
  }

  return (
    <DriveCardPage
      {...card}
      onMyTextChange={setMyText}
      onLeave={() => void handleLeave()}
      onRetry={retry}
      onAddPhotos={(files) => void addPhotos(files)}
      onRemovePhoto={(mediaId) => void removePhoto(mediaId)}
      onSwapPhotos={() => void swapPhotos()}
      onSave={() => void handleSave()}
    />
  )
}

// 드라이브가 바뀌면 카드 화면을 새로 마운트해 이전 카드의 상태가 남지 않게 한다
function DriveCardRouteByParam({ userId }: { userId: string }) {
  const { driveId = '' } = useParams()
  return <DriveCardRoute key={driveId} driveId={driveId} userId={userId} />
}

// 홈 데이터는 API 연동 전까지 목 데이터를 쓴다 (GET /home 연동 시 교체)
function App() {
  const auth = useAuth()
  const [home, setHome] = useState(MOCK_HOME)
  const [spots, setSpots] = useState(MOCK_SPOTS)
  const [pendingPromptSeen, setPendingPromptSeen] = useState(false)

  // 알림을 읽으면 홈의 새 알림 표시도 맞춘다. API 연동 후에는 홈을 다시 조회해 반영한다
  const handleNotificationRead = () =>
    setHome((prev) => ({ ...prev, unreadNotificationCount: Math.max(0, prev.unreadNotificationCount - 1) }))

  const setSpotLiked = (id: number, liked: boolean) =>
    setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, liked } : spot)))

  return (
    <Routes>
      <Route path={LOGIN_PATH} element={<LoginRoute auth={auth} />} />
      <Route path="/oauth/callback" element={<OAuthCallbackRoute auth={auth} />} />
      <Route path="/onboarding" element={<OnboardingFlow auth={auth} />}>
        <Route index element={<Navigate to="welcome" replace />} />
        <Route path="welcome" element={<WelcomeStep />} />
        <Route path="intro" element={<IntroStep />} />
        <Route path="nickname" element={<NicknameStep />} />
        <Route path="birthday" element={<BirthdayStep />} />
        <Route path="gender" element={<GenderStep />} />
        <Route path="anniversary" element={<AnniversaryStep />} />
        <Route path="mascot" element={<MascotStep />} />
      </Route>
      {/* 약관 문서는 가입 중(로그인 전 동의 화면)에도 볼 수 있다 */}
      {Object.entries(LEGAL_PATHS).map(([type, path]) => (
        <Route
          key={type}
          path={path}
          element={<LegalDocumentRoute key={type} type={type as LegalDocumentType} />}
        />
      ))}

      <Route element={<MemberGate auth={auth} />}>
        <Route
          path="/"
          element={
            <HomeRoute
              home={home}
              categories={MOCK_CATEGORIES}
              spots={spots}
              pendingPromptSeen={pendingPromptSeen}
              onPendingPromptSeen={() => setPendingPromptSeen(true)}
              onLikeToggle={setSpotLiked}
            />
          }
        />
        <Route path="/map" element={<RecordMapRoute />} />
        <Route path="/cards/:cardId" element={<RecordDetailRouteByParam />} />
        <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
        <Route path="/drive" element={<DriveRoute />} />
        <Route path="/drive/route" element={<RouteSettingRoute />} />
        <Route path="/my" element={<MyRoute auth={auth} />} />
        <Route path="/my/couple" element={<CoupleRoute />} />
        <Route path="/couple/invite" element={<CoupleInviteRoute />} />
        <Route
          path="/my/favorites"
          element={<FavoritesRoute onFavoriteChange={(placeId, favorite) => setSpotLiked(Number(placeId), favorite)} />}
        />
        <Route path="/my/playlists" element={<PlaylistsRoute />} />
        <Route path="/my/stories" element={<RadioStoriesRoute />} />
        <Route path="/drives/:driveId/card" element={<DriveCardRouteByParam userId={home.userId} />} />
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
      </Route>
    </Routes>
  )
}

export default App
