import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import { fetchCardShare } from '@/api/cards'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import useCardDetail from '@/hooks/useCardDetail'
import useNotifications from '@/hooks/useNotifications'
import usePlaceDetail from '@/hooks/usePlaceDetail'
import useRecordMap from '@/hooks/useRecordMap'
import useRecords from '@/hooks/useRecords'
import { MOCK_CATEGORIES, MOCK_HOME, MOCK_SPOTS } from '@/mocks/home'
import HomePage from '@/pages/Home/HomePage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import PlaceDetailPage from '@/pages/PlaceDetail/PlaceDetailPage'
import RecordDetailPage from '@/pages/RecordDetail/RecordDetailPage'
import RecordCalendarSheet from '@/pages/RecordMap/RecordCalendarSheet'
import RecordMapPage, { type RecordView } from '@/pages/RecordMap/RecordMapPage'
import RecordShareSheet from '@/pages/RecordMap/RecordShareSheet'
import type { HomeSummary } from '@/types/home'
import type { Notification } from '@/types/notification'
import type { RecordSummary } from '@/types/record'
import { todayInSeoul } from '@/utils/calendar'
import { formatDate } from '@/utils/formatDate'
import { copyText, createIdempotencyKey, type ShareChannel, type ShareLink, shareTo } from '@/utils/share'
import { shareStory } from '@/utils/storyImage'

// 화면 주소. 마이 화면은 아직 없어 탭을 눌러도 이동하지 않는다
const TAB_PATHS: Partial<Record<NavTab, string>> = {
  home: '/',
  map: '/map',
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
  onFavoriteChange: (placeId: string, favorite: boolean) => void
}

function PlaceDetailRoute({ placeId, couple, onFavoriteChange }: PlaceDetailRouteProps) {
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
      // TODO: 커플 코드 입력 화면이 생기면 이동한다
      onConnectRequired={() => {}}
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
      <Route path="/map" element={<RecordMapRoute />} />
      <Route path="/cards/:cardId" element={<RecordDetailRouteByParam />} />
      <Route path="/notifications" element={<NotificationsRoute onRead={handleNotificationRead} />} />
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
