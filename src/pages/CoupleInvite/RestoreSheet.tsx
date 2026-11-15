import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import styles from './RestoreSheet.module.scss'

interface RestoreSheetProps {
  // 성공하면 null, 실패하면 안내 문구
  onRestore: () => Promise<string | null>
  onClose: () => void
}

// 예전에 연결했던 연인의 코드를 입력했을 때 다시 연결할지 묻는 바텀시트 (POST /couples가 409 COUPLE_RESTORE_REQUIRED)
function RestoreSheet({ onRestore, onClose }: RestoreSheetProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRestore = async () => {
    setBusy(true)
    setError(await onRestore())
    setBusy(false)
  }

  return (
    <BottomSheet aria-label="예전에 연결했던 연인이에요" showClose={false} onClose={onClose}>
      <div className={styles.confirm}>
        <h2 className={styles.title}>예전에 연결했던 연인이에요</h2>
        <p className={styles.description}>
          다시 연결할까요?
          <br />
          함께 쌓은 기록도 그대로 돌아와요.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button size="cta" disabled={busy} onClick={() => void handleRestore()}>
            {busy ? '연결 중' : '다시 연결하기'}
          </Button>
          <Button variant="secondary" size="cta" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default RestoreSheet
