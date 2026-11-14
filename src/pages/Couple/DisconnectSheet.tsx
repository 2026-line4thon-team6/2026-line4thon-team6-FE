import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import styles from './CoupleSheets.module.scss'

interface DisconnectSheetProps {
  // 성공하면 null, 실패하면 안내 문구
  onDisconnect: () => Promise<string | null>
  onClose: () => void
}

// 커플 연결 해제 확인 바텀시트 (Figma: 연결 끊기)
function DisconnectSheet({ onDisconnect, onClose }: DisconnectSheetProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    setBusy(true)
    setError(await onDisconnect())
    setBusy(false)
  }

  return (
    <BottomSheet aria-label="커플 연결을 해제하시겠습니까?" showClose={false} onClose={onClose}>
      <div className={styles.confirm}>
        <h2 className={styles.confirmTitle}>커플 연결을 해제하시겠습니까?</h2>
        <p className={styles.confirmDescription}>
          연결을 해제하면 커플 공유 기능을
          <br />
          이용할 수 없어요.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.confirmActions}>
          <Button size="cta" disabled={busy} onClick={() => void handleDisconnect()}>
            연결 해제
          </Button>
          <Button variant="secondary" size="cta" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default DisconnectSheet
