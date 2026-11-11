import copyIcon from '@/assets/icons/copy.svg'
import pinIcon from '@/assets/icons/pin-md.svg'
import facebookIcon from '@/assets/images/share/facebook.webp'
import instagramIcon from '@/assets/images/share/instagram.webp'
import kakaotalkIcon from '@/assets/images/share/kakaotalk.webp'
import xIcon from '@/assets/images/share/x.webp'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import type { PlaceSummary } from '@/types/place'
import { formatDuration } from '@/utils/formatDuration'
import type { ShareChannel } from '@/utils/share'
import styles from './ShareSheet.module.scss'

const CHANNELS: { channel: ShareChannel; label: string; icon: string }[] = [
  { channel: 'kakaotalk', label: '카카오톡', icon: kakaotalkIcon },
  { channel: 'instagram', label: '인스타그램', icon: instagramIcon },
  { channel: 'x', label: 'X', icon: xIcon },
  { channel: 'facebook', label: '페이스북', icon: facebookIcon },
]

// 공유 링크 상태: 받아오는 중 / 받아옴 / 실패
export type ShareLink = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error' }

interface ShareSheetProps {
  place: PlaceSummary
  link: ShareLink
  onClose: () => void
  onCopyLink: (url: string) => void
  onShareChannel: (channel: ShareChannel, url: string) => void
}

// 장소 상세의 공유하기 바텀시트
function ShareSheet({ place, link, onClose, onCopyLink, onShareChannel }: ShareSheetProps) {
  const url = link.status === 'ready' ? link.url : null

  return (
    <BottomSheet aria-label="공유하기" onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.place}>
          <div className={styles.thumbnail}>{place.thumbnailUrl && <img src={place.thumbnailUrl} alt="" />}</div>
          <div className={styles.placeText}>
            <p className={styles.name}>{place.name}</p>
            <p className={styles.meta}>
              <img src={pinIcon} alt="" />
              {place.region} · {formatDuration(place.estimatedDurationSeconds)}
            </p>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.heading}>링크 공유하기</h2>
          <div className={styles.link}>
            <p className={styles.url}>
              {link.status === 'ready' && link.url}
              {link.status === 'loading' && '링크를 불러오고 있어요.'}
              {link.status === 'error' && '링크를 불러오지 못했어요.'}
            </p>
            <button
              type="button"
              className={styles.copy}
              aria-label="링크 복사"
              disabled={!url}
              onClick={() => url && onCopyLink(url)}
            >
              <img src={copyIcon} alt="" />
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>다른 방법으로 공유하기</h2>
          <ul className={styles.channels}>
            {CHANNELS.map(({ channel, label, icon }) => (
              <li key={channel}>
                <button
                  type="button"
                  className={styles.channel}
                  disabled={!url}
                  onClick={() => url && onShareChannel(channel, url)}
                >
                  <img src={icon} alt="" width={57} height={57} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </BottomSheet>
  )
}

export default ShareSheet
