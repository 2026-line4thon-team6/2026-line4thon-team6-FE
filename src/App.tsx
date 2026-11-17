import { useEffect, useState, ViewTransition } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { fetchCardShare } from '@/api/cards'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import useAuth, { type Auth } from '@/hooks/useAuth'
import useCoupleInvite from '@/hooks/useCoupleInvite'
import useCouplePage from '@/hooks/useCouplePage'
import useFaqs from '@/hooks/useFaqs'
import useFavorites from '@/hooks/useFavorites'
import useLegalDocument from '@/hooks/useLegalDocument'
import useMyCouple from '@/hooks/useMyCouple'
import CardPromptModal from '@/components/CardPromptModal/CardPromptModal'
import PendingCardSheet from '@/components/PendingCardSheet/PendingCardSheet'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import Toast from '@/components/Toast/Toast'
import useCardDetail from '@/hooks/useCardDetail'
import { arrangeGenres, arrangeMoods, arrangeWeathers } from '@/utils/playlistKeywords'
import useDrive from '@/hooks/useDrive'
import useActiveDrive from '@/hooks/useActiveDrive'
import useArrival from '@/hooks/useArrival'
import useDriveRestAreas from '@/hooks/useDriveRestAreas'
import usePlaylistGeneration from '@/hooks/usePlaylistGeneration'
import useDriveMap from '@/hooks/useDriveMap'
import useDrivePlaylist from '@/hooks/useDrivePlaylist'
import usePlaceRoute from '@/hooks/usePlaceRoute'
import useGpsRecorder from '@/hooks/useGpsRecorder'
import useDriveCard from '@/hooks/useDriveCard'
import useNotifications from '@/hooks/useNotifications'
import useHome from '@/hooks/useHome'
import useGoCard, { type CardNavigationState } from '@/hooks/useGoCard'
import usePendingCardDiscard from '@/hooks/usePendingCardDiscard'
import usePendingCardPicker from '@/hooks/usePendingCardPicker'
import usePendingCards from '@/hooks/usePendingCards'
import useRecommendations from '@/hooks/useRecommendations'
import usePlaceDetail from '@/hooks/usePlaceDetail'
import usePlaylistLibrary from '@/hooks/usePlaylistLibrary'
import usePublicPlace from '@/hooks/usePublicPlace'
import usePwaInstall from '@/hooks/usePwaInstall'
import useRadioEpisode from '@/hooks/useRadioEpisode'
import useAuthorizedAudio from '@/hooks/useAuthorizedAudio'
import useRadioGeneration from '@/hooks/useRadioGeneration'
import useRadioPlayer from '@/hooks/useRadioPlayer'
import useRadioStories from '@/hooks/useRadioStories'
import useRecordMap from '@/hooks/useRecordMap'
import useSendToPartner from '@/hooks/useSendToPartner'
import useRecords from '@/hooks/useRecords'
import useRestAreaAlert from '@/hooks/useRestAreaAlert'
import useRestAreaDetail from '@/hooks/useRestAreaDetail'
import useRouteRestAreas from '@/hooks/useRouteRestAreas'
import useRouteSetting from '@/hooks/useRouteSetting'
import useStartDrive, { type DriveLocationState } from '@/hooks/useStartDrive'
import useTimeOfDay from '@/hooks/useTimeOfDay'
import FavoritesPage from '@/pages/Archive/FavoritesPage'
import PlaylistsPage from '@/pages/Archive/PlaylistsPage'
import RadioStoriesPage from '@/pages/Archive/RadioStoriesPage'
import RadioPlayerProvider from '@/components/RadioPlayerProvider/RadioPlayerProvider'
import DriveRadioPage from '@/pages/DriveRadio/DriveRadioPage'
import BalanceGamePage from '@/pages/Game/BalanceGamePage'
import NonsenseQuizPage, { type Winner } from '@/pages/Game/NonsenseQuizPage'
import MemoryGamePage from '@/pages/Game/MemoryGamePage'
import useGameSession from '@/hooks/useGameSession'
import RadioStoriesDrawer from '@/pages/DriveRadio/RadioStoriesDrawer'
import { fetchRadioEpisode, RADIO_STORY_MAX_LENGTH } from '@/api/radio'
import type { RadioEpisode } from '@/types/radio'
import CouplePage from '@/pages/Couple/CouplePage'
import CoupleInvitePage from '@/pages/CoupleInvite/CoupleInvitePage'
import ContentCards from '@/pages/Drive/ContentCards'
import PlaylistGeneratingPage from '@/pages/DjPlaylist/PlaylistGeneratingPage'
import PlaylistPreferencePage from '@/pages/DjPlaylist/PlaylistPreferencePage'
import PlaylistResultPage from '@/pages/DjPlaylist/PlaylistResultPage'
import DrivePage from '@/pages/Drive/DrivePage'
import RestAreaDetailModal from '@/pages/Drive/RestAreaDetailModal'
import StampsTab from '@/pages/Drive/StampsTab'
import DriveCardPage from '@/pages/DriveCard/DriveCardPage'
import HomePage from '@/pages/Home/HomePage'
import FaqPage from '@/pages/Faq/FaqPage'
import LegalDocumentPage from '@/pages/LegalDocument/LegalDocumentPage'
import MyPage, { type MyMenu } from '@/pages/My/MyPage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import PlaceDetailPage from '@/pages/PlaceDetail/PlaceDetailPage'
import PublicPlacePage from '@/pages/PublicPlace/PublicPlacePage'
import RadioStoryPage from '@/pages/RadioStory/RadioStoryPage'
import RecordDetailPage from '@/pages/RecordDetail/RecordDetailPage'
import RecordCalendarSheet from '@/pages/RecordMap/RecordCalendarSheet'
import RecordMapPage, { type RecordView } from '@/pages/RecordMap/RecordMapPage'
import RecordShareSheet from '@/pages/RecordMap/RecordShareSheet'
import RouteSettingPage from '@/pages/RouteSetting/RouteSettingPage'
import {
  AnniversaryStep,
  BirthdayStep,
  GenderStep,
  GuestOrMemberGate,
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
import type { PendingCard } from '@/types/card'
import type { HomeSummary } from '@/types/home'
import type { PlaceCategory, PlaceSummary } from '@/types/place'
import type { LegalDocumentType } from '@/types/legal'
import type { Notification } from '@/types/notification'
import type { RecordSummary } from '@/types/record'
import type { Me } from '@/types/me'
import { CARD_PAGE_ENTER, PAGE_RECEDE } from '@/utils/cardTransition'
import { todayInSeoul } from '@/utils/calendar'
import { formatDate } from '@/utils/formatDate'
import { distanceMeters } from '@/utils/location'
import { copyText, type ShareChannel, shareInviteCode, type ShareLink, shareTo } from '@/utils/share'
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
  faq: '/my/faq',
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
    // 공유받은 장소는 장소 상세, 소감 · 카드 완료 알림은 기록 상세로 이동한다. 커플 알림은 이동하지 않는다
    if (notification.targetType === 'PLACE') {
      navigate(`/places/${encodeURIComponent(notification.targetId)}`)
    } else if (notification.targetType === 'CARD') {
      navigate(`/cards/${encodeURIComponent(notification.targetId)}`)
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
  myUserId: string
  onFavoriteChange: (placeId: string, favorite: boolean) => void
  // 연인에게 보내기가 커플 변경(403)으로 거절됐을 때 홈의 커플 정보를 다시 불러온다
  onCoupleChanged: () => void
}

function PlaceDetailRoute({ placeId, couple, mascotName, myUserId, onFavoriteChange, onCoupleChanged }: PlaceDetailRouteProps) {
  const navigate = useNavigate()
  const goBack = useGoBack()
  const drive = useStartDrive(myUserId)
  const { status, detail, retry, toggleFavorite, getShareUrl, sendToPartner } = usePlaceDetail(placeId)
  const route = usePlaceRoute(detail?.place ?? null)
  const handleSend = useSendToPartner({ coupleId: couple?.id ?? null, send: sendToPartner, onCoupleChanged })

  const handleFavoriteToggle = async (favorite: boolean) => {
    const saved = await toggleFavorite(favorite)
    if (saved) onFavoriteChange(placeId, favorite)
  }

  return (
    <>
      <PlaceDetailPage
        status={status}
        detail={detail}
        route={route}
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
      {drive.toast && <Toast message={drive.toast} onDone={drive.clearToast} />}
    </>
  )
}

const NEAR_DESTINATION_METERS = 300

function DriveRoute({ myUserId }: { myUserId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, drive, rename, pause, resume, end, cancel, sync } = useDrive()
  const { playing: radioPlaying } = useRadioPlayer()
  const drivePlaylist = useDrivePlaylist(drive)
  const map = useDriveMap(drive?.routeId ?? null)
  const driving = drive?.status === 'ACTIVE'
  const gps = useGpsRecorder({
    drive,
    position: map.position,
    recording: driving && drive?.recorderUserId === myUserId,
    urgent:
      !!map.current && !!map.destination && distanceMeters(map.current, map.destination) <= NEAR_DESTINATION_METERS,
    onReceipt: (receipt) => sync(receipt.drive),
  })
  const restAreas = useDriveRestAreas(drive?.id ?? null, drive?.routeId ?? null, driving)
  const { alert: restAreaAlert, dismiss: dismissRestAreaAlert } = useRestAreaAlert(restAreas, map.current, driving)
  const restAreaDetail = useRestAreaDetail()
  const [arrivedDriveId, setArrivedDriveId] = useState<string | null>(null)

  useArrival({
    active: drive?.status === 'ACTIVE',
    arrived: gps.arrivalCandidate,
    onArrive: async () => {
      const ended = await end('ARRIVED', await gps.flush())
      if (ended) setArrivedDriveId(ended.id)
      return ended !== null
    },
  })

  if (status === 'empty') return <Navigate to="/" replace />

  // TODO: 실패 토스트
  const handleEnd = async () => {
    const ended = await end('USER_ENDED', await gps.flush())
    if (ended) navigate('/', { replace: true })
    return ended !== null
  }

  return (
    <>
      <DrivePage
        status={status}
        drive={drive}
        currentCoordinate={map.current}
        routePath={map.path}
        routeDurationSeconds={map.routeDurationSeconds}
        origin={map.origin}
        destination={map.destination}
        restAreas={restAreas}
        onRestAreaClick={(restAreaId) => void restAreaDetail.open(restAreaId)}
        restAreaAlert={restAreaAlert && { name: restAreaAlert.restArea.name, meters: restAreaAlert.meters }}
        onRestAreaAlertClose={() => restAreaAlert && dismissRestAreaAlert(restAreaAlert.restArea.id)}
        onLocate={() => void map.locate()}
        onRename={rename}
        onRouteSearch={() =>
          navigate('/drive/route', {
            state: drive?.destination ? { destinationName: drive.destination.name } : location.state,
          })
        }
        onBack={() => navigate('/')}
        onPause={() => void pause()}
        onResume={() => void resume()}
        onEnd={handleEnd}
        onCancel={async () => {
          const cancelled = await cancel()
          if (cancelled) navigate('/', { replace: true })
          return cancelled
        }}
        locationDenied={map.locationDenied}
        onLocationRetry={map.retryLocation}
        // TODO: 게임 화면 연결
        contents={
          <ContentCards
            onPlaylistClick={() => navigate('/drive/playlist')}
            onContentClick={(kind) => {
              navigate(kind === 'radio' ? '/drive/radio' : `/drive/game/${kind}`)
            }}
            radioPlaying={radioPlaying}
            playlist={drivePlaylist}
          />
        }
        stamps={<StampsTab drive={drive} currentCoordinate={map.current} />}
      />
      {restAreaDetail.detail && <RestAreaDetailModal detail={restAreaDetail.detail} onClose={restAreaDetail.close} />}
      {arrivedDriveId && (
        <CardPromptModal
          variant="arrived"
          onConfirm={() => navigate(cardPath(arrivedDriveId), { replace: true })}
          onClose={() => navigate('/', { replace: true })}
        />
      )}
    </>
  )
}

function DjPlaylistRoute() {
  const navigate = useNavigate()
  const { drive } = useDrive()
  const generation = usePlaylistGeneration(drive?.id ?? null)
  const { config } = generation

  if (generation.step === 'generating') {
    return <PlaylistGeneratingPage onCancel={() => void generation.cancel()} onBack={() => void generation.cancel()} />
  }

  if (generation.step === 'done' && generation.playlist) {
    return (
      <PlaylistResultPage
        playlist={generation.playlist}
        onToggleSave={() => void generation.toggleSave()}
        onReorder={(trackIds) => void generation.reorder(trackIds)}
        onDelete={(trackId) => void generation.removeTrack(trackId)}
        onRestart={generation.restart}
        onSave={async () => {
          if (await generation.save()) navigate('/drive')
        }}
        onBack={() => navigate('/drive')}
      />
    )
  }

  return (
    <PlaylistPreferencePage
      moods={arrangeMoods(config?.moods ?? [])}
      weathers={arrangeWeathers(config?.weatherOptions ?? [])}
      genres={arrangeGenres(config?.genres ?? [])}
      moodMax={config?.limits.moodMaxCount ?? 2}
      genreMax={config?.limits.genreMaxCount ?? 3}
      value={generation.preference}
      submitting={generation.submitting}
      error={generation.error}
      onChange={generation.setPreference}
      onSubmit={() => void generation.submit()}
      onBack={() => navigate(-1)}
    />
  )
}

interface BalanceGameRouteProps {
  myUserId: string
  myNickname: string | null
  partnerNickname: string | null
}

function BalanceGameRoute({ myUserId, myNickname, partnerNickname }: BalanceGameRouteProps) {
  const navigate = useNavigate()
  const { status: driveStatus, drive } = useDrive()
  const game = useGameSession(drive, 'BALANCE')
  const responses = game.session?.responses ?? []
  const myChoice = responses.find((response) => response.authorUserId === myUserId)?.choice ?? null
  const myRole = drive?.passengerUserId === myUserId ? 'PASSENGER' : 'DRIVER'
  const question = game.session?.currentQuestion ?? null
  // TODO: 응답 API는 본인 응답만 저장한다(D07). 폰 하나로 상대 선택까지 저장하려면 백엔드 확인 필요
  const [partnerPick, setPartnerPick] = useState<{ questionId: string; choice: 'A' | 'B' } | null>(null)
  const partnerChoice =
    (partnerPick && partnerPick.questionId === question?.id ? partnerPick.choice : null) ??
    responses.find((response) => response.authorUserId !== myUserId)?.choice ??
    null

  useEffect(() => {
    if (game.status === 'completed') navigate('/drive', { replace: true })
  }, [game.status, navigate])

  if (driveStatus === 'empty') return <Navigate to="/" replace />

  return (
    <BalanceGamePage
      status={game.status}
      question={question}
      names={
        myRole === 'DRIVER'
          ? { DRIVER: myNickname, PASSENGER: partnerNickname }
          : { DRIVER: partnerNickname, PASSENGER: myNickname }
      }
      choices={
        myRole === 'DRIVER'
          ? { DRIVER: myChoice, PASSENGER: partnerChoice }
          : { DRIVER: partnerChoice, PASSENGER: myChoice }
      }
      busy={game.busy}
      onChoose={(role, choice) => {
        if (role === myRole) void game.respond({ type: 'BALANCE', choice }, myUserId)
        else if (question) setPartnerPick({ questionId: question.id, choice })
      }}
      onNext={() => void game.advance()}
      onRetry={game.retry}
      onAbandon={() => {
        void game.abandon()
        navigate('/drive', { replace: true })
      }}
    />
  )
}

function NonsenseQuizRoute({ myUserId, myNickname, partnerNickname }: BalanceGameRouteProps) {
  const navigate = useNavigate()
  const { status: driveStatus, drive } = useDrive()
  const game = useGameSession(drive, 'NONSENSE')
  const question = game.session?.currentQuestion ?? null
  // TODO: 누가 맞혔는지 저장하는 API가 명세에 없다(D07 점수 기록 없음) — 백엔드 확인 필요
  const [winner, setWinner] = useState<{ questionId: string; value: Winner } | null>(null)
  const meDriver = drive?.passengerUserId !== myUserId

  useEffect(() => {
    if (game.status === 'completed') navigate('/drive', { replace: true })
  }, [game.status, navigate])

  if (driveStatus === 'empty') return <Navigate to="/" replace />

  return (
    <NonsenseQuizPage
      status={game.status}
      question={question}
      names={
        meDriver
          ? { DRIVER: myNickname, PASSENGER: partnerNickname }
          : { DRIVER: partnerNickname, PASSENGER: myNickname }
      }
      winner={winner && winner.questionId === question?.id ? winner.value : null}
      busy={game.busy}
      onRevealHint={() => void game.revealHint()}
      onRevealAnswer={() => void game.revealAnswer()}
      onWinnerChange={(value) => question && setWinner({ questionId: question.id, value })}
      onNext={() => void game.advance()}
      onRetry={game.retry}
      onAbandon={() => {
        void game.abandon()
        navigate('/drive', { replace: true })
      }}
    />
  )
}

function MemoryGameRoute({ myUserId, myNickname, partnerNickname }: BalanceGameRouteProps) {
  const navigate = useNavigate()
  const { status: driveStatus, drive } = useDrive()
  const game = useGameSession(drive, 'MEMORY')
  const responses = game.session?.responses ?? []
  const winner =
    responses.find((response) => response.authorUserId === myUserId)?.selectedRole ??
    responses.find((response) => response.selectedRole)?.selectedRole ??
    null
  const meDriver = drive?.passengerUserId !== myUserId

  useEffect(() => {
    if (game.status === 'completed') navigate('/drive', { replace: true })
  }, [game.status, navigate])

  if (driveStatus === 'empty') return <Navigate to="/" replace />

  return (
    <MemoryGamePage
      status={game.status}
      question={game.session?.currentQuestion ?? null}
      names={
        meDriver
          ? { DRIVER: myNickname, PASSENGER: partnerNickname }
          : { DRIVER: partnerNickname, PASSENGER: myNickname }
      }
      winner={winner}
      busy={game.busy}
      noRecords={game.failure === 'MEMORY_RECORDS_REQUIRED'}
      onWinnerChange={(selectedRole) => void game.respond({ type: 'MEMORY', selectedRole }, myUserId)}
      onNext={() => void game.advance()}
      onRetry={game.retry}
      onAbandon={() => {
        void game.abandon()
        navigate('/drive', { replace: true })
      }}
    />
  )
}

function DriveRadioRoute() {
  const navigate = useNavigate()
  const { drive } = useDrive()
  const player = useRadioPlayer()
  const [composing, setComposing] = useState(!player.episode)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const generation = useRadioGeneration(drive?.id ?? null)

  const send = async (mode: 'USER_STORY' | 'RANDOM') => {
    const episode = await generation.send(mode)
    if (!episode) return
    player.start(episode)
    setComposing(false)
  }

  const play = async (episode: RadioEpisode) => {
    setDrawerOpen(false)
    const detail = await fetchRadioEpisode(episode.id)
      .then(({ data }) => data)
      .catch(() => episode)
    player.start(detail)
    setComposing(false)
  }

  return (
    <>
      <DriveRadioPage
        episode={player.episode}
        composing={composing}
        playing={player.playing}
        story={generation.story}
        maxLength={RADIO_STORY_MAX_LENGTH}
        generating={generation.generating}
        error={generation.error}
        onStoryChange={generation.setStory}
        onSend={() => void send('USER_STORY')}
        onRandom={() => void send('RANDOM')}
        onToggle={player.toggle}
        onStop={player.stop}
        onNewStory={() => setComposing(true)}
        onHalt={() => {
          player.clear()
          setComposing(true)
        }}
        onMenu={() => setDrawerOpen(true)}
        onBack={() => navigate('/drive')}
      />
      {drawerOpen && <RadioStoriesDrawerRoute onSelect={play} onClose={() => setDrawerOpen(false)} />}
    </>
  )
}

function RadioStoriesDrawerRoute({
  onSelect,
  onClose,
}: {
  onSelect: (episode: RadioEpisode) => void
  onClose: () => void
}) {
  const stories = useRadioStories()
  return (
    <RadioStoriesDrawer
      status={stories.status}
      episodes={stories.episodes}
      query={stories.query}
      keyword={stories.keyword}
      hasMore={stories.hasMore}
      loadingMore={stories.loadingMore}
      onQueryChange={stories.setQuery}
      onRetry={stories.retry}
      onSelect={onSelect}
      onLoadMore={() => void stories.loadMore()}
      onClose={onClose}
    />
  )
}

function RouteSettingRoute({ partnerNickname }: { partnerNickname: string | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, drive, setRoute, start } = useDrive()
  const { destinationPlaceId, destinationName } = (location.state ?? {}) as DriveLocationState
  const routeSetting = useRouteSetting(destinationPlaceId, destinationName)
  const routeRestAreas = useRouteRestAreas(routeSetting.route?.polyline ?? null)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (status === 'empty') return <Navigate to="/" replace />

  const backToDrive = () => (location.key === 'default' ? navigate('/drive', { replace: true }) : navigate(-1))

  const handleConfirm = async () => {
    if (!routeSetting.route) return
    setConfirming(true)
    const saved = await setRoute(routeSetting.route.id)
    // 출발까지 성공해야 드라이브 화면으로 돌아간다. 실패하면 경로 설정 화면에 남아 이유를 알린다
    const started = saved && drive?.status === 'PREPARING' ? await start() : 'started'
    setConfirming(false)
    if (!saved) return setToast('경로를 저장하지 못했어요. 다시 시도해 주세요.')
    if (started === 'started') return backToDrive()
    setToast(
      started === 'RECORDER_ONLY'
        ? `드라이브를 만든 ${partnerNickname ?? '연인'}님만 출발할 수 있어요.`
        : started === 'NO_LOCATION'
          ? '현재 위치를 확인할 수 없어 출발하지 못했어요.'
          : '출발하지 못했어요. 다시 시도해 주세요.',
    )
  }

  return (
    <>
      <RouteSettingPage
        originAddress={routeSetting.origin?.address || null}
        locationUnavailable={routeSetting.locationStatus === 'unavailable'}
        query={routeSetting.query}
        history={routeSetting.history}
        results={routeSetting.results}
        route={routeSetting.route}
        routeStatus={routeSetting.routeStatus}
        restAreas={routeRestAreas}
        confirming={confirming}
        onQueryChange={routeSetting.changeQuery}
        onSearch={routeSetting.submitSearch}
        onRecentSelect={routeSetting.selectRecent}
        onRecentDelete={routeSetting.deleteRecent}
        onResultSelect={routeSetting.selectPlace}
        onConfirm={() => void handleConfirm()}
        onClose={backToDrive}
      />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

// 기록 지도. 검색어나 날짜가 바뀌면 지도 마커와 기록 목록을 그 조건으로 다시 불러온다.
// 검색어와 날짜는 함께 쓰지 않는다. 상단의 '총 N번'은 조건과 관계없는 목록 API의 totalCount를 쓴다
// 보기 방식 · 검색어 · 날짜는 주소(?view=list&q=...&date=...)에 둔다. 기록 상세에 갔다가 돌아와도 보던 조건이 그대로 남는다
interface RecordMapRouteProps {
  // GET /home 의 미작성 카드 (홈 배너와 같은 데이터). 아직 불러오지 않았으면 null
  pendingCards: PendingCard[] | null
  pendingReceivedAt: number
  // 들어올 때마다 홈 데이터를 새로 불러온다. 카드 작성에서 나가 바로 기록 지도로 와도 배너가 맞게 뜬다
  onEnter: () => void
}

function RecordMapRoute({ pendingCards, pendingReceivedAt, onEnter }: RecordMapRouteProps) {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const pendingCard = usePendingCards(pendingCards, pendingReceivedAt)
  // 카드 작성 화면이 아래에서 올라오고, 누른 카드 이름이 제목 자리로 이어진다
  const goCard = useGoCard()
  const pendingPicker = usePendingCardPicker(pendingCard, (driveId) =>
    goCard(driveId, pendingCard?.cards.find((card) => card.driveId === driveId)?.title),
  )
  // 목록에서 카드를 지우면 홈 정보(미작성 카드 목록)를 다시 받는다
  const discardPending = usePendingCardDiscard(onEnter)

  // 처음 마운트 때만 부른다 (onEnter는 렌더마다 새 함수라 의존성에 넣지 않는다)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onEnter(), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const view: RecordView = searchParams.get('view') === 'list' ? 'list' : 'map'
  const query = searchParams.get('q') ?? ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('date') ?? '') ? searchParams.get('date') : null
  const [calendarOpen, setCalendarOpen] = useState(false)
  // 공유 중인 기록 카드와 그 카드의 커플 전용 링크
  const [sharing, setSharing] = useState<{ card: RecordSummary; link: ShareLink } | null>(null)
  const filter = date ? { date } : { q: query }
  const map = useRecordMap(filter)
  const list = useRecords(filter)

  // 조건을 바꿀 때 방문 기록이 쌓이지 않게 주소를 바꿔 끼운다. 빈 값과 기본 보기(지도형)는 주소에서 뺀다
  const updateFilter = (next: { view?: RecordView; q?: string; date?: string | null }) => {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === 'view' && value === 'map')) params.set(key, value)
      else params.delete(key)
    }
    setSearchParams(params, { replace: true })
  }

  const handleSearch = (nextQuery: string) => updateFilter({ q: nextQuery, date: null })

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

  // 기능명세서 9️⃣: 같은 날짜에 기록이 여러 개면 목록형으로 나열한다. 하나면 보던 화면 그대로 둔다
  const handleDateSelect = (nextDate: string, count: number) => {
    updateFilter({ date: nextDate, q: '', ...(count > 1 && { view: 'list' as const }) })
    setCalendarOpen(false)
  }

  const retry = () => {
    if (map.status === 'error') map.retry()
    if (list.status === 'error') list.retry()
  }

  // 카드 작성 화면으로 갈 때는 이 화면이 살짝 물러나며 어두워진다
  return (
    <ViewTransition exit={PAGE_RECEDE} default="none">
      <RecordMapPage
        view={view}
        totalCount={list.totalCount}
        date={date}
        query={query}
        mapStatus={map.status}
        markers={map.markers}
        listStatus={list.status}
        records={list.records}
        hasMoreRecords={list.hasMore}
        onSearch={handleSearch}
        onViewChange={(nextView) => updateFilter({ view: nextView })}
        onLoadMore={() => void list.loadMore()}
        onRetry={retry}
        onConnectRequired={() => navigate('/couple/invite')}
        onTabChange={goTab}
        onCalendarClick={() => setCalendarOpen(true)}
        onDateClear={() => updateFilter({ date: null })}
        onCardClick={(card) => navigate(`/cards/${encodeURIComponent(card.cardId)}`)}
        onShare={handleShare}
        pendingCard={pendingCard}
        onPendingCardClick={pendingPicker.open}
      />
      {sharing && (
        <RecordShareSheet
          card={sharing.card}
          link={sharing.link}
          onClose={() => setSharing(null)}
          onCopyLink={copyText}
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
      {pendingPicker.sheetOpen && pendingCard && (
        <PendingCardSheet
          cards={pendingCard.cards}
          onSelect={pendingPicker.select}
          onClose={pendingPicker.close}
          onDiscard={discardPending}
        />
      )}
    </ViewTransition>
  )
}

// 기록 상세. 삭제하면 이전 화면(기록 지도)으로 돌아가고, 기록 지도는 다시 불러와 지운 기록이 빠진다
interface RecordDetailRouteProps {
  cardId: string
  // 소감 칸을 나 · 상대방으로 나눌 때 쓴다
  myUserId: string
  myNickname: string
  partnerNickname: string | null
  // 소감 칸 캐릭터는 가입 때 고른 내 성별을 따른다
  myGender: Me['gender']
}

function RecordDetailRoute({ cardId, myUserId, myNickname, partnerNickname, myGender }: RecordDetailRouteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  // 기능명세서 🔟: 뒤로가기는 기록 지도로 간다. 공유 링크로 바로 열었을 때도 홈이 아니라 기록 지도로 보낸다
  const goBack = useGoBack('/map')
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
      myUserId={myUserId}
      myNickname={myNickname}
      partnerNickname={partnerNickname}
      myGender={myGender}
      // TODO: 플레이리스트 화면이 생기면 연결한다
    />
  )
}

function RecordDetailRouteByParam(props: Omit<RecordDetailRouteProps, 'cardId'>) {
  const { cardId = '' } = useParams()
  return <RecordDetailRoute key={cardId} cardId={cardId} {...props} />
}

// 장소가 바뀌면 상세 화면을 새로 마운트해 이전 장소의 상태가 남지 않게 한다
function PlaceDetailRouteByParam(props: Omit<PlaceDetailRouteProps, 'placeId'>) {
  const { placeId = '' } = useParams()
  return <PlaceDetailRoute key={placeId} placeId={placeId} {...props} />
}

// 공유 링크를 로그인 전 사용자가 열었을 때의 공개 장소 화면. 시작하기를 누르면 로그인 화면으로 간다
function PublicPlaceRoute({ placeId }: { placeId: string }) {
  const navigate = useNavigate()
  const { status, place, retry } = usePublicPlace(placeId)

  return <PublicPlacePage status={status} place={place} onRetry={retry} onStart={() => navigate(LOGIN_PATH)} />
}

function PublicPlaceRouteByParam() {
  const { placeId = '' } = useParams()
  return <PublicPlaceRoute key={placeId} placeId={placeId} />
}

// 마이 화면에 들어올 때마다 커플 요약을 새로 불러온다
function MyRoute({ auth }: { auth: Auth }) {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const { status, couple } = useMyCouple()
  const pwa = usePwaInstall()

  const handleMenuClick = (menu: MyMenu) => {
    const legal = LEGAL_MENUS[menu]
    const path = legal ? LEGAL_PATHS[legal] : ARCHIVE_PATHS[menu]
    if (path) navigate(path)
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
      installMode={pwa.mode}
      onInstall={pwa.install}
    />
  )
}

// 커플 페이지. 연결을 해제하면 마이 화면으로 돌아간다 (기능명세서: 해제 후 이동 화면 확인 필요)
function CoupleRoute() {
  const navigate = useNavigate()
  const goBack = useGoBack('/my')
  const { retry, changeStartDate, renameMascot, updateProfile, disconnect, clearActiveDrive, ...state } = useCouplePage()

  return (
    <CouplePage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onChangeStartDate={changeStartDate}
      onRenameMascot={renameMascot}
      onUpdateProfile={updateProfile}
      onDisconnect={disconnect}
      onDisconnected={() => navigate('/my', { replace: true })}
      onClearActiveDrive={clearActiveDrive}
      onGoDrive={() => navigate('/drive')}
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
  const { status, places, hasMore, loadingMore, category, selectCategory, toggleFavorite, loadMore, retry } =
    useFavorites()

  const handleFavoriteToggle = async (placeId: string, favorite: boolean) => {
    if (await toggleFavorite(placeId, favorite)) onFavoriteChange(placeId, favorite)
  }

  return (
    <FavoritesPage
      status={status}
      places={places}
      category={category}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onBack={goBack}
      onRetry={retry}
      onLoadMore={() => void loadMore()}
      onSelectCategory={selectCategory}
      onFavoriteToggle={(placeId, favorite) => void handleFavoriteToggle(placeId, favorite)}
      onPlaceClick={(placeId) => navigate(`/places/${encodeURIComponent(placeId)}`)}
    />
  )
}

function PlaylistsRoute() {
  const goBack = useGoBack('/my')
  const { retry, loadMore, ...state } = usePlaylistLibrary()

  // TODO: 저장한 플레이리스트 상세 화면이 생기면 이동한다 (GET /playlists/{id}).
  // DJ 생성 완료 화면(PlaylistResultPage)은 생성 흐름 전용(다시 만들기 · 불러오기 상태 없음)이라 그대로 쓰지 않는다
  return (
    <PlaylistsPage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onLoadMore={() => void loadMore()}
      onPlaylistClick={() => {}}
    />
  )
}

function RadioStoriesRoute() {
  const navigate = useNavigate()
  const goBack = useGoBack('/my')
  const { setQuery, retry, loadMore, ...state } = useRadioStories()

  return (
    <RadioStoriesPage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onLoadMore={() => void loadMore()}
      onQueryChange={setQuery}
      onStoryClick={(episodeId) => navigate(`/my/stories/${encodeURIComponent(episodeId)}`)}
    />
  )
}

// 라디오 사연 상세. 주소로 바로 들어왔으면 뒤로가기로 보관함에 간다
function RadioStoryRoute({ episodeId }: { episodeId: string }) {
  const goBack = useGoBack('/my/stories')
  const { refreshAudio, retry, status, episode } = useRadioEpisode(episodeId)
  // 음성은 토큰을 붙여 미리 받은 blob URL로 재생한다 (받기 전 · 실패하면 null → 재생 버튼 비활성)
  const audioSrc = useAuthorizedAudio(episode?.audioUrl ?? null)

  return (
    <RadioStoryPage
      status={status}
      episode={episode && { ...episode, audioUrl: audioSrc }}
      onBack={goBack}
      onRetry={retry}
      onAudioError={refreshAudio}
    />
  )
}

// 사연이 바뀌면 상세 화면을 새로 마운트해 이전 사연의 재생 상태가 남지 않게 한다
function RadioStoryRouteByParam() {
  const { episodeId = '' } = useParams()
  return <RadioStoryRoute key={episodeId} episodeId={episodeId} />
}

// 연인 초대 · 코드 연결. 연결하거나 건너뛰면 메인 홈으로 간다 (기능명세서 L9)
function CoupleInviteRoute() {
  const navigate = useNavigate()
  const goBack = useGoBack('/')
  const { retry, connect, restore, ...state } = useCoupleInvite()
  const goHome = () => navigate('/', { replace: true })

  return (
    <CoupleInvitePage
      {...state}
      onBack={goBack}
      onRetry={retry}
      onCopy={copyText}
      onShare={shareInviteCode}
      onConnect={connect}
      onRestore={restore}
      onConnected={goHome}
      onSkip={goHome}
    />
  )
}

function FaqRoute() {
  const goBack = useGoBack('/my')
  const { retry, ...state } = useFaqs()

  return <FaqPage {...state} onBack={goBack} onRetry={retry} />
}

function LegalDocumentRoute({ type }: { type: LegalDocumentType }) {
  const goBack = useGoBack('/my')
  const { status, document, retry } = useLegalDocument(type)

  return <LegalDocumentPage type={type} status={status} document={document} onBack={goBack} onRetry={retry} />
}

const cardPath = (driveId: string) => `/drives/${encodeURIComponent(driveId)}/card`

interface HomeRouteProps {
  home: HomeSummary
  // GET /home 의 미작성 카드. 아직 불러오지 않았으면 null
  pendingCards: PendingCard[] | null
  pendingReceivedAt: number
  // 홈에 다시 들어오면 새로 불러온다 (카드 저장 · 커플 변경 반영)
  onEnter: () => void
  myUserId: string
  // 추천 카테고리와 그 장소 (GET /places/recommendations). 불러오는 중이면 null
  category: PlaceCategory
  places: PlaceSummary[] | null
  onCategoryChange: (category: PlaceCategory) => void
  // 미작성 카드 팝업은 앱을 켠 뒤 한 번만 띄운다. 이후에는 배너로만 알린다
  pendingPromptSeen: boolean
  onPendingPromptSeen: () => void
  // 위치 권한이 막혀 날씨 · 교통을 못 채울 때 띄우는 설정 안내. 앱을 켠 뒤 한 번만 띄운다
  locationNoticeOpen: boolean
  onLocationNoticeDone: () => void
  onLikeToggle: (id: string, liked: boolean) => void
}

// 홈에 들어올 때마다 홈 데이터(미작성 카드 포함)를 새로 불러온다
function HomeRoute({
  home,
  pendingCards,
  pendingReceivedAt,
  onEnter,
  myUserId,
  category,
  places,
  onCategoryChange,
  pendingPromptSeen,
  onPendingPromptSeen,
  locationNoticeOpen,
  onLocationNoticeDone,
  onLikeToggle,
}: HomeRouteProps) {
  const navigate = useNavigate()
  const goTab = useTabNavigate()
  const summary = usePendingCards(pendingCards, pendingReceivedAt)
  const drive = useStartDrive(myUserId)
  const activeDrive = useActiveDrive()
  const timeOfDay = useTimeOfDay()

  // 처음 마운트 때만 부른다 (onEnter는 렌더마다 새 함수라 의존성에 넣지 않는다)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onEnter(), [])

  // 카드 작성 화면이 아래에서 올라오고, 목록에서 누른 카드 이름은 제목 자리로 이어진다
  const goCardWithTransition = useGoCard()
  const goCard = (driveId: string) => {
    onPendingPromptSeen()
    goCardWithTransition(driveId, summary?.cards.find((card) => card.driveId === driveId)?.title)
  }
  // 미작성 카드가 2개 이상이면 배너를 눌렀을 때 목록에서 고르게 한다
  const pendingPicker = usePendingCardPicker(summary, goCard)
  // 목록에서 카드를 지우면 홈 정보(미작성 카드 목록)를 다시 받는다
  const discardPending = usePendingCardDiscard(onEnter)

  // 카드 작성 화면으로 갈 때는 이 화면이 살짝 물러나며 어두워진다
  return (
    <ViewTransition exit={PAGE_RECEDE} default="none">
      <HomePage
        timeOfDay={timeOfDay}
        home={home}
        category={category}
        places={places}
        onCategoryChange={onCategoryChange}
        carConnected
        pendingCard={summary}
        activeDrive={activeDrive !== 'none'}
        activeDrivePreparing={activeDrive === 'preparing'}
        onActiveDriveClick={() => navigate('/drive')}
        onNotificationClick={() => navigate('/notifications')}
        onSpotClick={(id) => navigate(`/places/${id}`)}
        onLikeToggle={onLikeToggle}
        onStartDrive={() => void drive.start()}
        onTabChange={goTab}
        onPendingCardClick={pendingPicker.open}
      />
      <DriveNameSheet
        open={drive.sheetOpen}
        mode="create"
        mascotName={home.mascotName}
        onSubmit={(name) => void drive.submit(name)}
        onClose={drive.closeSheet}
      />
      {pendingPicker.sheetOpen && summary && (
        <PendingCardSheet
          cards={summary.cards}
          onSelect={pendingPicker.select}
          onClose={pendingPicker.close}
          onDiscard={discardPending}
        />
      )}
      {summary && !pendingPromptSeen && (
        <CardPromptModal
          variant="pending"
          remainingSeconds={summary.remainingSeconds}
          onConfirm={() => goCard(summary.driveId)}
          onClose={onPendingPromptSeen}
        />
      )}
      {/* 웹앱은 기기 설정 화면을 직접 열 수 없어 문구로 안내한다. 홈은 위치 없이도 쓸 수 있어 막지 않는 토스트로 띄운다 */}
      {/* 토스트는 같은 자리에 뜨므로 드라이브 시작 실패를 먼저 보여 준다 */}
      {drive.toast ? (
        <Toast message={drive.toast} onDone={drive.clearToast} />
      ) : (
        locationNoticeOpen && (
          <Toast
            message="브라우저 설정에서 위치 권한을 허용하면 주변 날씨와 교통 정보를 볼 수 있어요."
            duration={4000}
            onDone={onLocationNoticeDone}
          />
        )
      )}
    </ViewTransition>
  )
}

interface DriveCardRouteProps {
  driveId: string
  userId: string
  // 소감 칸(내 칸 · 연인 칸)에 보여 줄 닉네임과, 캐릭터를 고를 내 성별
  myNickname: string
  partnerNickname: string | null
  myGender: Me['gender']
}

function DriveCardRoute({ driveId, userId, myNickname, partnerNickname, myGender }: DriveCardRouteProps) {
  const navigate = useNavigate()
  const goBack = useGoBack()
  // 카드를 지우면 들어온 화면(기록 지도 · 홈)으로 돌아간다. 주소로 바로 열었으면 기록 지도로 간다
  const goBackAfterDelete = useGoBack('/map')
  // 미작성 카드 목록 · 배너에서 들어오면 카드 이름을 알고 있어, 불러오는 동안에도 제목을 먼저 그린다
  const pendingTitle = (useLocation().state as CardNavigationState | null)?.cardTitle ?? null
  const { setMyText, save, saveDraft, retry, addPhotos, removePhoto, swapPhotos, remove, ...card } = useDriveCard(
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

  const handleDelete = async () => {
    const outcome = await remove()
    if (outcome === 'deleted') goBackAfterDelete()
    return outcome
  }

  // 미작성 카드 목록 · 배너에서 들어올 때는 아래에서 올라온다 (다른 화면에서 올 때는 전환 없음)
  return (
    <ViewTransition enter={CARD_PAGE_ENTER} default="none">
      <DriveCardPage
        {...card}
        driveId={driveId}
        pendingTitle={pendingTitle}
        myNickname={myNickname}
        partnerNickname={partnerNickname}
        myGender={myGender}
        onMyTextChange={setMyText}
        onLeave={() => void handleLeave()}
        onRetry={retry}
        onAddPhotos={(files) => void addPhotos(files)}
        onRemovePhoto={(mediaId) => void removePhoto(mediaId)}
        onSwapPhotos={() => void swapPhotos()}
        onSave={() => void handleSave()}
        onDelete={handleDelete}
      />
    </ViewTransition>
  )
}

// 드라이브가 바뀌면 카드 화면을 새로 마운트해 이전 카드의 상태가 남지 않게 한다
function DriveCardRouteByParam(props: Omit<DriveCardRouteProps, 'driveId'>) {
  const { driveId = '' } = useParams()
  return <DriveCardRoute key={driveId} driveId={driveId} {...props} />
}

// 홈 데이터(GET /home)는 로그인한 뒤 앱 전체에서 한 번 불러와 커플 · 붕붕이 이름을 여러 화면이 같이 쓴다
function App() {
  const auth = useAuth()
  const homeData = useHome(auth.status === 'signedIn' ? auth.user : null)
  const home = homeData.summary
  // 추천 장소는 홈을 떠났다 와도 다시 받지 않도록 App에 둔다. 상세 · 보관함의 찜 변경도 여기에 맞춘다
  const recommendations = useRecommendations(auth.status === 'signedIn' && auth.user !== null)
  const [pendingPromptSeen, setPendingPromptSeen] = useState(false)
  const [locationNoticeSeen, setLocationNoticeSeen] = useState(false)
  // 로그인한 사용자(GET /me)를 먼저 쓰고, 없으면 홈 응답의 내 정보를 쓴다
  const me = { id: auth.user?.id ?? home.userId, nickname: auth.user?.nickname ?? home.nickname, gender: auth.user?.gender ?? null }
  const partnerNickname = home.couple?.partnerNickname ?? null

  // 알림을 읽으면 홈을 다시 불러와 새 알림 표시를 맞춘다
  const handleNotificationRead = () => void homeData.reload()

  return (
    <RadioPlayerProvider>
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
                pendingCards={homeData.pendingCards}
                pendingReceivedAt={homeData.receivedAt}
                onEnter={() => void homeData.reload()}
                myUserId={me.id}
                category={recommendations.category}
                places={recommendations.places}
                onCategoryChange={recommendations.setCategory}
                pendingPromptSeen={pendingPromptSeen}
                onPendingPromptSeen={() => setPendingPromptSeen(true)}
                locationNoticeOpen={homeData.locationDenied && !locationNoticeSeen}
                onLocationNoticeDone={() => setLocationNoticeSeen(true)}
                onLikeToggle={(placeId, liked) => void recommendations.toggleFavorite(placeId, liked)}
              />
            }
          />
          <Route
            path="/map"
            element={
              <RecordMapRoute
                pendingCards={homeData.pendingCards}
                pendingReceivedAt={homeData.receivedAt}
                onEnter={() => void homeData.reload()}
              />
            }
          />
          <Route
            path="/cards/:cardId"
            element={
              <RecordDetailRouteByParam
                myUserId={me.id}
                myNickname={me.nickname}
                partnerNickname={partnerNickname}
                myGender={me.gender}
              />
            }
          />
          <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
          <Route path="/drive" element={<DriveRoute myUserId={me.id} />} />
          <Route path="/drive/route" element={<RouteSettingRoute partnerNickname={partnerNickname} />} />
          <Route path="/drive/playlist" element={<DjPlaylistRoute />} />
          <Route path="/drive/radio" element={<DriveRadioRoute />} />
          <Route
            path="/drive/game/balance"
            element={<BalanceGameRoute myUserId={me.id} myNickname={me.nickname} partnerNickname={partnerNickname} />}
          />
          <Route
            path="/drive/game/nonsense"
            element={<NonsenseQuizRoute myUserId={me.id} myNickname={me.nickname} partnerNickname={partnerNickname} />}
          />
          <Route
            path="/drive/game/memory"
            element={<MemoryGameRoute myUserId={me.id} myNickname={me.nickname} partnerNickname={partnerNickname} />}
          />
          <Route path="/my" element={<MyRoute auth={auth} />} />
          <Route path="/my/couple" element={<CoupleRoute />} />
          <Route path="/couple/invite" element={<CoupleInviteRoute />} />
          <Route
            path="/my/favorites"
            element={<FavoritesRoute onFavoriteChange={(placeId, favorite) => recommendations.syncFavorite(placeId, favorite)} />}
          />
          <Route path="/my/playlists" element={<PlaylistsRoute />} />
          <Route path="/my/stories" element={<RadioStoriesRoute />} />
          <Route path="/my/stories/:episodeId" element={<RadioStoryRouteByParam />} />
          <Route path="/my/faq" element={<FaqRoute />} />
          <Route
            path="/drives/:driveId/card"
            element={
              <DriveCardRouteByParam
                userId={me.id}
                myNickname={me.nickname}
                partnerNickname={partnerNickname}
                myGender={me.gender}
              />
            }
          />
        </Route>

        {/* 장소 공유 링크({PLACE_SHARE_BASE_URL}/places/{placeId})는 받은 사람이 로그인하지 않았어도 열려야 한다.
            로그인 전이면 공개 장소 화면, 로그인했으면 기존 회원용 상세를 같은 주소에서 보여 준다 */}
        <Route element={<GuestOrMemberGate auth={auth} guest={<PublicPlaceRouteByParam />} />}>
          <Route
            path="/places/:placeId"
            element={
              <PlaceDetailRouteByParam
                couple={home.couple}
                mascotName={home.mascotName}
                myUserId={me.id}
                // 상세에서 바꾼 찜 상태를 홈 카드에도 반영한다
                onFavoriteChange={(placeId, favorite) => recommendations.syncFavorite(placeId, favorite)}
                onCoupleChanged={() => void homeData.reload()}
              />
            }
          />
        </Route>
      </Routes>
    </RadioPlayerProvider>
  )
}

export default App
