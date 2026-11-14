import copyIcon from '@/assets/icons/copy.svg'
import pinIcon from '@/assets/icons/pin-md.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import ShareChannelList from '@/components/ShareChannelList/ShareChannelList'
import type { PlaceSummary } from '@/types/place'
import { formatDuration } from '@/utils/formatDuration'
import type { ShareChannel, ShareLink } from '@/utils/share'
import styles from './ShareSheet.module.scss'

export type { ShareLink } from '@/utils/share'

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
          <ShareChannelList disabled={!url} onSelect={(channel) => url && onShareChannel(channel, url)} />
        </section>
      </div>
    </BottomSheet>
  )
}

export default ShareSheet
