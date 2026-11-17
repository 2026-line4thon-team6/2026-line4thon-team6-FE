import { useState } from 'react'
import copyIcon from '@/assets/icons/copy.svg'
import downloadIcon from '@/assets/icons/download.svg'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import ShareChannelList from '@/components/ShareChannelList/ShareChannelList'
import Toast from '@/components/Toast/Toast'
import type { RecordSummary } from '@/types/record'
import { formatDate } from '@/utils/formatDate'
import type { ImageSaveResult, ShareChannel, ShareLink } from '@/utils/share'
import styles from './RecordShareSheet.module.scss'
import RecordPhoto from '@/components/RecordPhoto/RecordPhoto'

interface RecordShareSheetProps {
  card: RecordSummary
  link: ShareLink
  onClose: () => void
  // 공유 이미지를 복사한다. image: 이미지를 복사함 · link: 이미지 복사를 지원하지 않아 링크를 복사함. 못 하면 거절한다
  onCopyImage: () => Promise<'image' | 'link'>
  // 공유 이미지를 저장한다 (휴대폰 공유 시트 또는 파일 내려받기). 못 하면 거절한다
  onSaveImage: () => Promise<ImageSaveResult>
  onShareChannel: (channel: ShareChannel, url: string) => void
}

const COPY_MESSAGES = { image: '이미지를 복사했어요.', link: '이미지를 복사할 수 없어 링크를 복사했어요.' }

// 기록 지도 미리보기 카드의 공유 바텀시트 (Figma 284:15197). 채널을 고르면 '지도 + 카드' 이미지를 기기 공유 창으로 넘긴다 (지원하지 않으면 링크)
function RecordShareSheet({ card, link, onClose, onCopyImage, onSaveImage, onShareChannel }: RecordShareSheetProps) {
  const url = link.status === 'ready' ? link.url : null
  const [toast, setToast] = useState<string | null>(null)
  // 이미지를 만드는 동안(잠깐 걸린다) 두 번 누르지 않게 막는다
  const [busy, setBusy] = useState(false)

  // 기능명세서 1️⃣1️⃣: 복사됐는지 알 수 있게 결과를 토스트로 알린다
  const handleCopy = async () => {
    setBusy(true)
    try {
      setToast(COPY_MESSAGES[await onCopyImage()])
    } catch {
      setToast('이미지를 복사하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  // 휴대폰 공유 시트로 넘긴 경우는 저장 여부를 알 수 없어 알리지 않는다
  const handleSave = async () => {
    setBusy(true)
    try {
      if ((await onSaveImage()) === 'downloaded') setToast('이미지를 저장했어요.')
    } catch {
      setToast('이미지를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
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
              {/* 커플 전용 링크 대신 '지도 + 카드' 공유 이미지를 복사 · 저장한다 */}
              <div className={styles.imageActions}>
                <button type="button" className={styles.imageAction} disabled={busy} onClick={() => void handleCopy()}>
                  <img src={copyIcon} alt="" />
                  이미지 복사
                </button>
                <button type="button" className={styles.imageAction} disabled={busy} onClick={() => void handleSave()}>
                  <img src={downloadIcon} alt="" />
                  이미지 저장
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
