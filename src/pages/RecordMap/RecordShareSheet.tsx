import { useState } from 'react'
import copyIcon from '@/assets/icons/copy.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import ShareChannelList from '@/components/ShareChannelList/ShareChannelList'
import Toast from '@/components/Toast/Toast'
import type { RecordSummary } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import type { ShareChannel, ShareLink } from '@/utils/share'
import styles from './RecordShareSheet.module.scss'
import RecordPhoto from '@/components/RecordPhoto/RecordPhoto'

interface RecordShareSheetProps {
  card: RecordSummary
  link: ShareLink
  onClose: () => void
  // 복사하지 못하면 거절한다. 결과는 시트가 토스트로 알린다
  onCopyLink: (url: string) => Promise<void>
  onShareChannel: (channel: ShareChannel, url: string) => void
}

// 기록 지도 미리보기 카드의 공유 바텀시트 (Figma 284:15197). 채널을 고르면 '지도 + 카드' 이미지를 기기 공유 창으로 넘긴다 (지원하지 않으면 링크)
function RecordShareSheet({ card, link, onClose, onCopyLink, onShareChannel }: RecordShareSheetProps) {
  const url = link.status === 'ready' ? link.url : null
  const [toast, setToast] = useState<string | null>(null)

  // 기능명세서 1️⃣1️⃣: 복사 아이콘만으로는 복사됐는지 알 수 없어 결과를 토스트로 알린다
  const handleCopy = async (target: string) => {
    try {
      await onCopyLink(target)
      setToast('링크를 복사했어요.')
    } catch {
      setToast('링크를 복사하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <>
      <BottomSheet aria-label="드라이브 기록 카드 공유하기" onClose={onClose}>
        <div className={styles.content}>
          <div className={styles.summary}>
            {/* 미리보기와 같은 폴라로이드 카드를 줄여서 보여준다 */}
            <div className={styles.thumbnail} aria-hidden="true">
              <div className={styles.polaroid}>
                <RecordPhoto className={styles.photo} src={card.thumbnailUrl} />
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
                  onClick={() => url && void handleCopy(url)}
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
      {/* 시트는 transform으로 띄워 그 안에서는 fixed가 화면 기준이 아니므로 시트 바깥에 둔다 */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

export default RecordShareSheet
