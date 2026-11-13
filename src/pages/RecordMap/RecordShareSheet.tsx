import copyIcon from '@/assets/icons/copy.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import ShareChannelList from '@/components/ShareChannelList/ShareChannelList'
import type { RecordSummary } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import type { ShareChannel, ShareLink } from '@/utils/share'
import styles from './RecordShareSheet.module.scss'

interface RecordShareSheetProps {
  card: RecordSummary
  link: ShareLink
  onClose: () => void
  onCopyLink: (url: string) => void
  onShareChannel: (channel: ShareChannel, url: string) => void
}

// 기록 지도 미리보기 카드의 공유 바텀시트 (Figma 284:15197). 인스타그램은 카드를 스토리 이미지로 넘긴다
function RecordShareSheet({ card, link, onClose, onCopyLink, onShareChannel }: RecordShareSheetProps) {
  const url = link.status === 'ready' ? link.url : null

  return (
    <BottomSheet aria-label="드라이브 기록 카드 공유하기" onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.summary}>
          {/* 미리보기와 같은 폴라로이드 카드를 줄여서 보여준다 */}
          <div className={styles.thumbnail} aria-hidden="true">
            <div className={styles.polaroid}>
              <img className={styles.photo} src={card.thumbnailUrl} alt="" />
              <span className={styles.polaroidTitle}>{card.title}</span>
              <span className={styles.polaroidDate}>{formatDate(card.driveDate)}</span>
            </div>
          </div>

          <div className={styles.text}>
            <h2 className={styles.heading}>드라이브 기록 카드</h2>
            <p className={styles.description}>우리가 함께 달린 길을 공유해보세요.</p>
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
          </div>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>다른 방법으로 공유하기</h3>
          <ShareChannelList disabled={!url} onSelect={(channel) => url && onShareChannel(channel, url)} />
        </section>
      </div>
    </BottomSheet>
  )
}

export default RecordShareSheet
