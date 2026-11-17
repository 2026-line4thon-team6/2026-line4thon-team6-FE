import { useState } from 'react'
import pinIcon from '@/assets/icons/pin-lg.svg'
import durationIcon from '@/assets/images/info/info-car.svg'
import parkingIcon from '@/assets/images/info/info-parking.svg'
import roadIcon from '@/assets/images/info/info-road.svg'
import visitIcon from '@/assets/images/info/info-sun.svg'
import Button from '@/components/Button/Button'
import DriveMap from '@/components/DriveMap/DriveMap'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import LikeButton from '@/components/LikeButton/LikeButton'
import { PLACE_CATEGORIES } from '@/constants/placeCategories'
import type { PlaceRoute } from '@/hooks/usePlaceRoute'
import type { PlaceDetail } from '@/types/place'
import { formatDuration, formatRegionDuration } from '@/utils/formatDuration'
import type { ShareChannel } from '@/utils/share'
import styles from './PlaceDetailPage.module.scss'
import SendToPartnerModal, { type SendStep } from './SendToPartnerModal'
import ShareSheet, { type ShareLink } from './ShareSheet'

// 값을 불러오지 못했을 때의 표시
const ROUTE_FIT_PADDING: [number, number, number, number] = [36, 40, 12, 40]

interface PlaceDetailPageProps {
  status: 'loading' | 'ready' | 'error'
  detail: PlaceDetail | null
  // 현재 위치에서 이 장소까지의 경로. 위치를 모르거나 아직 못 받았으면 null
  route?: PlaceRoute | null
  // 연결된 연인의 이름. 연결 전이면 null
  partnerNickname: string | null
  onBack: () => void
  onRetry: () => void
  onFavoriteToggle: (favorite: boolean) => void
  onStartDrive: () => void
  // 공유 링크를 받아 온다 (GET /places/{placeId}/share)
  getShareUrl: () => Promise<string>
  onCopyLink: (url: string) => void
  onShareChannel: (channel: ShareChannel, url: string) => void
  // 연인에게 보낸다. 실패하면 reject한다 (POST /places/{placeId}/send-to-partner)
  onSendToPartner: () => Promise<void>
  // 연인과 연결되지 않은 상태에서 '연인에게 보내기'를 눌렀을 때 (커플 코드 화면으로 이동)
  onConnectRequired: () => void
}

// '오후 5-8시 (일몰 시간대)' → ['오후 5-8시', '(일몰 시간대)']
function splitNote(text: string) {
  const match = /^(.*?)\s*(\(.+\))$/.exec(text)
  return match ? [match[1], match[2]] : [text, null]
}

function PlaceDetailPage({
  status,
  detail,
  route = null,
  partnerNickname,
  onBack,
  onRetry,
  onFavoriteToggle,
  onStartDrive,
  getShareUrl,
  onCopyLink,
  onShareChannel,
  onSendToPartner,
  onConnectRequired,
}: PlaceDetailPageProps) {
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [sendStep, setSendStep] = useState<SendStep | null>(null)

  if (status !== 'ready' || !detail) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        </div>
        {status === 'error' ? (
          <div className={styles.message} role="alert">
            <p>장소 정보를 불러오지 못했어요.</p>
            <button type="button" className={styles.textButton} onClick={onRetry}>
              다시 시도
            </button>
          </div>
        ) : (
          <p className={styles.message} role="status">
            장소 정보를 불러오고 있어요.
          </p>
        )}
      </div>
    )
  }

  const { place, photos, introduction, parkingInfo, recommendedVisitTime, mainRoads } = detail
  const category = PLACE_CATEGORIES[place.category]
  const durationSeconds = route?.durationSeconds ?? place.estimatedDurationSeconds
  // 서버가 아직 채우지 않은 항목은 칸째 숨기고, 남은 칸이 폭을 똑같이 나눈다 (4칸이 다 있으면 시안 비율)
  const [visitTime, visitNote] = recommendedVisitTime ? splitNote(recommendedVisitTime) : [null, null]
  const summaryItems = [
    { label: '예상 소요 시간', icon: durationIcon, value: durationSeconds === null ? null : formatDuration(durationSeconds) },
    { label: '주요 경로', icon: roadIcon, value: mainRoads.length > 0 ? mainRoads.join(', ') : null },
    { label: '주차 정보', icon: parkingIcon, value: parkingInfo || null },
    { label: '추천 방문 시간', icon: visitIcon, value: visitTime, note: visitNote },
  ].filter((item) => item.value)
  const summaryColumns =
    summaryItems.length < 4 ? { gridTemplateColumns: `repeat(${summaryItems.length}, 1fr)` } : undefined
  // 맨 위에는 대표 사진 1장만 보여 준다 (Figma 70:1744). 사진이 없으면 장소 썸네일
  const heroPhoto = photos[0] ?? place.thumbnailUrl

  const openShare = () => {
    setShareLink({ status: 'loading' })
    getShareUrl()
      .then((url) => setShareLink((prev) => (prev ? { status: 'ready', url } : prev)))
      .catch(() => setShareLink((prev) => (prev ? { status: 'error' } : prev)))
  }

  const openSend = () => {
    if (partnerNickname === null) {
      onConnectRequired()
      return
    }
    setSendStep('confirm')
  }

  const send = () => {
    setSendStep('sending')
    onSendToPartner()
      .then(() => setSendStep((prev) => (prev ? 'sent' : prev)))
      .catch(() => setSendStep((prev) => (prev ? 'failed' : prev)))
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {heroPhoto && <img className={styles.heroPhoto} src={heroPhoto} alt={`${place.name} 사진`} />}
      </div>

      <div className={styles.topBar}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <div className={styles.topActions}>
          <LikeButton size="lg" liked={place.isFavorite} onToggle={onFavoriteToggle} />
          <GlassIconButton icon="share" aria-label="공유하기" onClick={openShare} />
        </div>
      </div>

      <main className={styles.content}>
        <div className={styles.titleRow}>
          <div className={styles.titleText}>
            <h1 className={styles.name}>{place.name}</h1>
            <p className={styles.meta}>
              <img src={pinIcon} alt="" />
              {formatRegionDuration(place.region, durationSeconds)}
            </p>
            {/* 명세는 주소를 요구하지만 Figma 위치 줄은 '지역 · 시간'이라, 위치 줄은 그대로 두고 전체 주소를 한 줄 더 보여 준다 */}
            {place.address && place.address !== place.region && <p className={styles.address}>{place.address}</p>}
          </div>
          <p className={styles.category}>
            <img src={category.icon} alt="" />
            {category.label}
          </p>
        </div>

        {place.hashtags.length > 0 && (
          <ul className={styles.tags}>
            {place.hashtags.map((tag) => (
              <li key={tag} className={styles.tag}>
                #{tag}
              </li>
            ))}
          </ul>
        )}

        {introduction && <p className={styles.introduction}>{introduction}</p>}

        {summaryItems.length > 0 && (
          <ul className={styles.summary} aria-label="드라이브 정보" style={summaryColumns}>
            {summaryItems.map(({ label, icon, value, note }) => (
              <li key={label}>
                <span className={styles.summaryIcon}>
                  <img src={icon} alt="" />
                </span>
                <span className={styles.summaryLabel}>{label}</span>
                <span className={styles.summaryValue}>{value}</span>
                {note && <span className={styles.summaryNote}>{note}</span>}
              </li>
            ))}
          </ul>
        )}

        <section className={styles.route} aria-labelledby="route-preview-title">
          <h2 id="route-preview-title" className={styles.routeTitle}>
            경로 미리보기
          </h2>
          {route ? (
            <div className={styles.map} aria-label={`내 위치에서 ${place.name}까지 경로`} role="img">
              <DriveMap
                compact
                path={route.path}
                origin={route.origin}
                destination={route.destination}
                fitPadding={ROUTE_FIT_PADDING}
              />
            </div>
          ) : (
            // 경로가 없는 이유가 위치 권한만은 아니다. 권한 탓을 하지 않는 중립 문구로 둔다
            <p className={styles.mapEmpty}>경로 미리보기를 준비 중이에요.</p>
          )}
        </section>
      </main>

      <div className={styles.bottomBar}>
        <Button variant="secondary" icon="letter" onClick={openSend}>
          연인에게 보내기
        </Button>
        <Button icon="car" onClick={onStartDrive}>
          드라이브 시작하기
        </Button>
      </div>

      {shareLink && (
        <ShareSheet
          place={place}
          link={shareLink}
          onClose={() => setShareLink(null)}
          onCopyLink={onCopyLink}
          onShareChannel={onShareChannel}
        />
      )}

      {sendStep && partnerNickname !== null && (
        <SendToPartnerModal
          step={sendStep}
          partnerNickname={partnerNickname}
          onSend={send}
          onClose={() => setSendStep(null)}
        />
      )}
    </div>
  )
}

export default PlaceDetailPage
