import { useState } from 'react'
import carIcon from '@/assets/icons/record-detail-car.svg'
import pinIcon from '@/assets/icons/record-detail-pin.svg'
import playlistButtonIcon from '@/assets/icons/playlist-button.svg'
// 기록 캐릭터 그림: driver = 남자, passenger = 여자 캐릭터
import maleImage from '@/assets/images/record-driver.webp'
import femaleImage from '@/assets/images/record-passenger.webp'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { DeleteOutcome } from '@/hooks/useCardDetail'
import type { Card, CardPlaylist } from '@/types/card'
import { formatDate } from '@/utils/formatDate'
import { formatDistance, formatDriveTime } from '@/utils/formatDrive'
import DeleteCardModal from './DeleteCardModal'
import type { Me } from '@/types/me'
import { reflectionCharacters, type CharacterGender } from '@/utils/character'
import styles from './RecordDetailPage.module.scss'

interface RecordDetailPageProps {
  status: 'loading' | 'ready' | 'notFound' | 'error'
  card: Card | null
  onBack: () => void
  onRetry: () => void
  // 삭제에 성공하면 부모가 화면을 옮긴다. 실패하면 팝업에 안내를 띄운다
  onDelete: () => Promise<DeleteOutcome>
  onPlaylistClick?: (playlist: CardPlaylist) => void
  // 소감 칸을 나 · 상대방으로 나눌 때 쓴다. 비어 있는 칸에도 닉네임을 보여 준다
  myUserId: string
  myNickname: string
  partnerNickname: string | null
  // 소감 칸 캐릭터는 가입 때 고른 내 성별을 따른다
  myGender: Me['gender']
}

// 수정 기간이 끝났는데 비어 있는 소감 칸의 안내
const EMPTY_REFLECTION = {
  mine: '기록을 작성하지 않았어요 :)',
  partner: '상대방이 기록을 남기지 않았어요 :)',
}

const DELETE_ERRORS: Record<Exclude<DeleteOutcome, 'deleted'>, string> = {
  failed: '삭제하지 못했어요. 다시 시도해 주세요.',
  conflict: '카드 내용이 바뀌었어요. 확인 후 다시 삭제해 주세요.',
}

// 소감 작성자 캐릭터. 카드 응답에 운전자 · 동승자 구분이 없어 순서대로 쓴다
const CHARACTER_IMAGES: Record<CharacterGender, string> = { MALE: maleImage, FEMALE: femaleImage }

// 기록 지도 - 카드 상세 (Figma 284:15397)
function RecordDetailPage({
  status,
  card,
  onBack,
  onRetry,
  onDelete,
  onPlaylistClick,
  myUserId,
  myNickname,
  partnerNickname,
  myGender,
}: RecordDetailPageProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const closeConfirm = () => {
    setConfirming(false)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    const outcome = await onDelete()
    setDeleting(false)
    if (outcome !== 'deleted') setDeleteError(DELETE_ERRORS[outcome])
  }

  const photos = card ? [...card.photos].sort((a, b) => a.order - b.order) : []
  // 소감은 내 칸 → 연인 칸 두 칸을 항상 보여 준다 (운전자 · 동승자 구분 없음). 제출하지 않은 초안은 쓰지 않은 것으로 본다
  const submitted = card ? card.reflections.filter((reflection) => reflection.submitted) : []
  const mine = submitted.find((reflection) => reflection.author.id === myUserId) ?? null
  const partner = submitted.find((reflection) => reflection.author.id !== myUserId) ?? null
  const characters = reflectionCharacters(myGender)
  const reflectionSlots = [
    { key: 'mine', reflection: mine, nickname: myNickname, empty: EMPTY_REFLECTION.mine, character: characters.mine },
    {
      key: 'partner',
      reflection: partner,
      nickname: partnerNickname ?? '연인',
      empty: EMPTY_REFLECTION.partner,
      character: characters.partner,
    },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        {card && <h1 className={styles.date}>{formatDate(card.driveDate)}</h1>}
        {card?.canDelete ? (
          <GlassIconButton icon="delete" aria-label="카드 삭제" onClick={() => setConfirming(true)} />
        ) : (
          <span className={styles.headerSpacer} aria-hidden="true" />
        )}
      </header>

      {status === 'loading' && (
        <p className={styles.notice} role="status">
          기록을 불러오는 중이에요
        </p>
      )}
      {status === 'notFound' && (
        <p className={styles.notice} role="alert">
          삭제되었거나 볼 수 없는 기록이에요
        </p>
      )}
      {status === 'error' && (
        <div className={styles.notice} role="alert">
          기록을 불러오지 못했어요
          <button className={styles.retry} type="button" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      )}

      {status === 'ready' && card && (
        <main className={styles.content}>
          <div className={styles.titleBox}>
            <img src={carIcon} alt="" width={19} height={16} />
            <span className={styles.title}>{card.title}</span>
          </div>

          <p className={styles.place}>
            <img src={pinIcon} alt="" width={12} height={15} />
            {card.destination?.name ?? card.region}
          </p>

          <dl className={styles.stats}>
            {[
              ['이동 거리', formatDistance(card.distanceMeters)],
              ['주행 시간', formatDriveTime(card.activeDurationSeconds)],
              ['휴게소 도장', `${card.stampCount}개`],
            ].map(([label, value]) => (
              <div key={label} className={styles.stat}>
                <dt className={styles.statLabel}>{label}</dt>
                <dd className={styles.statValue}>{value}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.playlist} aria-label="함께 들었던 플레이리스트">
            <span className={styles.playlistCover}>
              {card.playlist?.thumbnailUrl && <img src={card.playlist.thumbnailUrl} alt="" />}
            </span>
            <div className={styles.playlistText}>
              <span className={styles.playlistBadge}>함께 들었던 플레이리스트</span>
              <span className={styles.playlistTitle}>{card.playlist?.title ?? '- -'}</span>
              {card.playlist && (
                <span className={styles.playlistMeta}>
                  총 {card.playlist.trackCount}곡 · 약 {formatDriveTime(card.playlist.durationSeconds)}
                </span>
              )}
            </div>
            {/* 플레이리스트 화면이 아직 없으면 누를 수 없는 아이콘으로만 보여준다 */}
            {card.playlist &&
              (onPlaylistClick ? (
                <button
                  className={styles.playlistButton}
                  type="button"
                  aria-label="플레이리스트 보기"
                  onClick={() => card.playlist && onPlaylistClick(card.playlist)}
                >
                  <img src={playlistButtonIcon} alt="" width={40} height={40} />
                </button>
              ) : (
                <img className={styles.playlistButton} src={playlistButtonIcon} alt="" width={40} height={40} />
              ))}
          </section>

          {photos.length > 0 && (
            <ul className={[styles.photos, photos.length === 1 && styles.single].filter(Boolean).join(' ')} aria-label="드라이브 사진">
              {photos.map((photo, index) => (
                <li key={photo.mediaId}>
                  <img className={styles.photo} src={photo.url} alt={`드라이브 사진 ${index + 1}`} />
                </li>
              ))}
            </ul>
          )}

          <ul className={styles.reflections} aria-label="소감">
            {reflectionSlots.map(({ key, reflection, nickname, empty, character }) => (
              <li key={key} className={styles.reflection}>
                <div className={styles.author}>
                  <img
                    className={styles.avatar}
                    src={reflection?.author.profileImageUrl ?? CHARACTER_IMAGES[character]}
                    alt=""
                    width={51}
                    height={51}
                    data-character={reflection?.author.profileImageUrl ? undefined : character}
                  />
                  <span className={styles.nickname}>{reflection?.author.nickname ?? nickname}</span>
                </div>
                <p className={[styles.reflectionText, !reflection && styles.emptyReflection].filter(Boolean).join(' ')}>
                  {reflection?.text ?? empty}
                </p>
              </li>
            ))}
          </ul>
        </main>
      )}

      {confirming && (
        <DeleteCardModal deleting={deleting} error={deleteError} onConfirm={() => void handleDelete()} onClose={closeConfirm} />
      )}
    </div>
  )
}

export default RecordDetailPage
