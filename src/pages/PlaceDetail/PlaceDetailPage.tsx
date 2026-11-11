import { useState } from 'react'
import type { UIEvent } from 'react'
import mapLabel from '@/assets/icons/map-label.svg'
import pinIcon from '@/assets/icons/pin-lg.svg'
import durationIcon from '@/assets/images/info/info-car.svg'
import parkingIcon from '@/assets/images/info/info-parking.svg'
import roadIcon from '@/assets/images/info/info-road.svg'
import visitIcon from '@/assets/images/info/info-sun.svg'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import LikeButton from '@/components/LikeButton/LikeButton'
import { PLACE_CATEGORIES } from '@/constants/placeCategories'
import useDragScroll from '@/hooks/useDragScroll'
import type { PlaceDetail } from '@/types/place'
import { formatDuration } from '@/utils/formatDuration'
import type { ShareChannel } from '@/utils/share'
import styles from './PlaceDetailPage.module.scss'
import SendToPartnerModal, { type SendStep } from './SendToPartnerModal'
import ShareSheet, { type ShareLink } from './ShareSheet'

// 값을 불러오지 못했을 때의 표시
const EMPTY = '--'
// 본문에 나열하는 사진 썸네일 수. 나머지는 '+N'으로 표시한다
const THUMBNAIL_COUNT = 3
// 경로 미리보기 지도. 지도 SDK 연동 전까지 쓰는 고정 이미지
const ROUTE_PREVIEW_IMAGE = '/mocks/places/route-preview.webp'

interface PlaceDetailPageProps {
  status: 'loading' | 'ready' | 'error'
  detail: PlaceDetail | null
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
  const photoDrag = useDragScroll<HTMLUListElement>()
  const [photoIndex, setPhotoIndex] = useState(0)
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

  const { place, photos, introduction, parkingInfo, recommendedVisitTime, mainRoads, previewRouteId } = detail
  const category = PLACE_CATEGORIES[place.category]
  const duration = formatDuration(place.estimatedDurationSeconds)
  const [visitTime, visitNote] = splitNote(recommendedVisitTime ?? EMPTY)
  const slides = photos.length > 0 ? photos : place.thumbnailUrl ? [place.thumbnailUrl] : []
  const extraPhotos = slides.length - THUMBNAIL_COUNT

  const handlePhotoScroll = (event: UIEvent<HTMLUListElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget
    if (clientWidth > 0) setPhotoIndex(Math.round(scrollLeft / clientWidth))
  }

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
        <ul className={styles.photos} aria-label="장소 사진" onScroll={handlePhotoScroll} {...photoDrag}>
          {slides.map((photo, index) => (
            <li key={index}>
              <img src={photo} alt={`${place.name} 사진 ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} />
            </li>
          ))}
        </ul>
        {slides.length > 0 && (
          <p className={styles.counter}>
            {Math.min(photoIndex, slides.length - 1) + 1} / {slides.length}
          </p>
        )}
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
              {place.region} · {duration}
            </p>
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

        {slides.length > 0 && (
          <div className={styles.thumbnails}>
            {slides.slice(0, THUMBNAIL_COUNT).map((photo, index) => (
              <img key={index} src={photo} alt="" loading="lazy" />
            ))}
            {extraPhotos > 0 && <span className={styles.more}>+{extraPhotos}</span>}
          </div>
        )}

        <ul className={styles.summary} aria-label="드라이브 정보">
          <li>
            <span className={styles.summaryIcon}>
              <img src={durationIcon} alt="" />
            </span>
            <span className={styles.summaryLabel}>예상 소요 시간</span>
            <span className={styles.summaryValue}>{duration}</span>
          </li>
          <li>
            <span className={styles.summaryIcon}>
              <img src={roadIcon} alt="" />
            </span>
            <span className={styles.summaryLabel}>주요 경로</span>
            <span className={styles.summaryValue}>{mainRoads.length > 0 ? mainRoads.join(', ') : EMPTY}</span>
          </li>
          <li>
            <span className={styles.summaryIcon}>
              <img src={parkingIcon} alt="" />
            </span>
            <span className={styles.summaryLabel}>주차 정보</span>
            <span className={styles.summaryValue}>{parkingInfo ?? EMPTY}</span>
          </li>
          <li>
            <span className={styles.summaryIcon}>
              <img src={visitIcon} alt="" />
            </span>
            <span className={styles.summaryLabel}>추천 방문 시간</span>
            <span className={styles.summaryValue}>{visitTime}</span>
            {visitNote && <span className={styles.summaryNote}>{visitNote}</span>}
          </li>
        </ul>

        <section className={styles.route} aria-labelledby="route-preview-title">
          <h2 id="route-preview-title" className={styles.routeTitle}>
            경로 미리보기
          </h2>
          {previewRouteId ? (
            <div className={styles.map}>
              <img className={styles.mapImage} src={ROUTE_PREVIEW_IMAGE} alt="" loading="lazy" />
              <span className={[styles.mapLabel, styles.origin].join(' ')}>
                <img src={mapLabel} alt="" />
                <span>출발지</span>
              </span>
              <span className={[styles.mapLabel, styles.destination].join(' ')}>
                <img src={mapLabel} alt="" />
                <span>도착지</span>
              </span>
            </div>
          ) : (
            <p className={styles.mapEmpty}>위치 권한을 허용하면 경로를 볼 수 있어요.</p>
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
