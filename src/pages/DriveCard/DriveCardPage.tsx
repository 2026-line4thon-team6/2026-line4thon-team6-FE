import { useState } from 'react'
import carIcon from '@/assets/icons/car-coral.svg'
import pinIcon from '@/assets/icons/pin-coral-sm.svg'
import playlistIcon from '@/assets/icons/playlist.svg'
import driverImage from '@/assets/images/card/character-driver.webp'
import passengerImage from '@/assets/images/card/character-passenger.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import { isCardEditable, MAX_REFLECTION_LENGTH, type DriveRole } from '@/hooks/useDriveCard'
import type { Card } from '@/types/card'
import { formatCardDate, formatDistance, formatDriveTime, formatPlaylistDuration } from '@/utils/cardFormat'
import styles from './DriveCardPage.module.scss'
import LeaveCardModal from './LeaveCardModal'
import PhotoSection from './PhotoSection'

const ROLES: { role: DriveRole; label: string; image: string }[] = [
  { role: 'PASSENGER', label: '동승자', image: passengerImage },
  { role: 'DRIVER', label: '운전자', image: driverImage },
]

interface DriveCardPageProps {
  status: 'loading' | 'ready' | 'error' | 'unavailable'
  card: Card | null
  // 이 드라이브에서 나의 역할. 내 역할 칸에 소감을 쓰고, 다른 칸에는 연인의 소감을 보여 준다
  myRole: DriveRole | null
  // 소감 칸 이름. 운전자 · 동승자 대신 각자의 닉네임을 보여 준다 (없으면 역할 이름)
  myNickname: string | null
  partnerNickname: string | null
  myText: string
  // 연인이 제출한 소감. 아직 없으면 null
  partnerText: string | null
  canSave: boolean
  // 아직 서버에 남기지 못한 소감이 있는지 (저장을 마친 카드에서 나갈 때 물어볼지 정한다)
  hasUnsavedChanges: boolean
  busy: boolean
  error: string | null
  onMyTextChange: (text: string) => void
  // 화면을 나간다 (저장 전이면 작성 중단 팝업에서 '나가기'를 누른 뒤)
  onLeave: () => void
  onRetry: () => void
  onAddPhotos: (files: File[]) => void
  onRemovePhoto: (mediaId: string) => void
  onSwapPhotos: () => void
  onSave: () => void
}

// 드라이브 카드 작성 화면 (드라이브 도착 팝업 · 홈 미작성 배너에서 들어온다)
function DriveCardPage({
  status,
  card,
  myRole,
  myNickname,
  partnerNickname,
  myText,
  partnerText,
  canSave,
  hasUnsavedChanges,
  busy,
  error,
  onMyTextChange,
  onLeave,
  onRetry,
  onAddPhotos,
  onRemovePhoto,
  onSwapPhotos,
  onSave,
}: DriveCardPageProps) {
  const [leaveOpen, setLeaveOpen] = useState(false)

  if (status !== 'ready' || !card) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onLeave} />
        </div>
        <div className={styles.message} role={status === 'loading' ? 'status' : 'alert'}>
          {status === 'loading' && <p>카드를 불러오는 중이에요.</p>}
          {status === 'unavailable' && <p>작성 기간이 지났거나 작성할 수 없는 카드예요.</p>}
          {status === 'error' && (
            <>
              <p>카드를 불러오지 못했어요.</p>
              <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
                다시 시도
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // 24시간이 지나 더 고칠 수 없으면 묻지 않고 나간다. 저장을 마친 카드는 고치고 저장하지 않은 내용이 있을 때만 묻는다
  const handleBack = () => {
    if (!isCardEditable(card) || (card.status === 'COMPLETED' && !hasUnsavedChanges)) return onLeave()
    setLeaveOpen(true)
  }
  const editable = card.canEdit && !busy

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={handleBack} />
        <h1 className={styles.date}>{formatCardDate(card.driveDate)}</h1>
      </header>

      <main className={styles.content}>
        <p className={styles.titleBar}>
          <img src={carIcon} alt="" />
          <span className={styles.title}>{card.title}</span>
        </p>

        <p className={styles.region}>
          <img src={pinIcon} alt="" />
          {card.region}
        </p>

        <ul className={styles.stats} aria-label="드라이브 기록">
          <li className={styles.stat}>
            <span className={styles.statLabel}>이동 거리</span>
            <span className={styles.statValue}>{formatDistance(card.distanceMeters)}</span>
          </li>
          <li className={styles.stat}>
            <span className={styles.statLabel}>주행 시간</span>
            <span className={styles.statValue}>{formatDriveTime(card.activeDurationSeconds)}</span>
          </li>
          <li className={styles.stat}>
            <span className={styles.statLabel}>휴게소 도장</span>
            <span className={styles.statValue}>{card.stampCount}개</span>
          </li>
        </ul>

        {/* 플레이리스트를 안 쓴 드라이브도 같은 자리에 카드를 두고 제목만 '- -'로 보여 준다 (기능명세 18) */}
        <section className={styles.playlist} aria-labelledby="card-playlist-badge">
          {card.playlist?.thumbnailUrl ? (
            <img className={styles.playlistCover} src={card.playlist.thumbnailUrl} alt="" />
          ) : (
            <span className={styles.playlistCover} aria-hidden />
          )}
          <div className={styles.playlistText}>
            <h2 id="card-playlist-badge" className={styles.playlistBadge}>
              함께 들었던 플레이리스트
            </h2>
            <p className={styles.playlistTitle}>{card.playlist?.title ?? '- -'}</p>
            {card.playlist && (
              <p className={styles.playlistMeta}>
                총 {card.playlist.trackCount}곡 · {formatPlaylistDuration(card.playlist.durationSeconds)}
              </p>
            )}
          </div>
          {/* TODO: 플레이리스트 화면이 생기면 버튼으로 바꿔 이동한다 */}
          <img className={styles.playlistIcon} src={playlistIcon} alt="" />
        </section>

        <PhotoSection
          photos={card.photos}
          disabled={!editable}
          onAdd={onAddPhotos}
          onRemove={onRemovePhoto}
          onSwap={onSwapPhotos}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.reflections}>
          {ROLES.map(({ role, label, image }) => {
            const mine = role === myRole
            const name = (myRole && (mine ? myNickname : partnerNickname)) || label
            return (
              <div key={role} className={styles.reflection} role="group" aria-label={name}>
                <p className={styles.roleLabel} aria-hidden>
                  <span className={styles.roleImage}>
                    <img src={image} alt="" />
                  </span>
                  {name}
                </p>
                {mine ? (
                  <textarea
                    className={styles.field}
                    aria-label="내 한 줄 소감"
                    placeholder="드라이브의 한줄 소감을 작성해주세요 :)"
                    rows={1}
                    maxLength={MAX_REFLECTION_LENGTH}
                    value={myText}
                    disabled={!card.canEdit}
                    onChange={(event) => onMyTextChange(event.target.value.replace(/\n/g, ' '))}
                  />
                ) : (
                  <p className={[styles.field, partnerText === null && styles.placeholder].filter(Boolean).join(' ')}>
                    {partnerText ?? '상대방이 아직 소감을 입력하지 않았어요 :)'}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Button className={styles.save} size="cta" disabled={!canSave || busy} onClick={onSave}>
          {busy ? '저장 중…' : '저장하기'}
        </Button>
      </main>

      {leaveOpen && (
        <LeaveCardModal
          onLeave={() => {
            setLeaveOpen(false)
            onLeave()
          }}
          onClose={() => setLeaveOpen(false)}
        />
      )}
    </div>
  )
}

export default DriveCardPage
