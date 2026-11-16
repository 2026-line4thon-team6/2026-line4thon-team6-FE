import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import type { ClearDriveOutcome, DisconnectResult } from '@/hooks/useCouplePage'
import styles from './CoupleSheets.module.scss'

interface DisconnectSheetProps {
  // 성공하면 null, 실패하면 안내 문구 (activeDrive면 진행 중인 드라이브 때문에 막힘)
  onDisconnect: () => Promise<DisconnectResult>
  // 연결 해제를 막는 드라이브를 정리한다 (준비 중이면 취소, 출발했으면 goDrive)
  onClearActiveDrive: () => Promise<ClearDriveOutcome>
  // 출발한 드라이브는 드라이브 화면의 '드라이브 마치기'로 끝내야 한다
  onGoDrive: () => void
  onClose: () => void
}

const NOTICES: Record<Exclude<ClearDriveOutcome, 'goDrive'>, string> = {
  cancelled: '준비 중이던 드라이브를 취소했어요. 연결 해제를 다시 눌러 주세요.',
  none: '진행 중인 드라이브가 없어요. 연결 해제를 다시 눌러 주세요.',
}
const CLEAR_FAILED = '드라이브를 정리하지 못했어요. 잠시 후 다시 시도해 주세요.'

// 커플 연결 해제 확인 바텀시트 (Figma: 연결 끊기)
function DisconnectSheet({ onDisconnect, onClearActiveDrive, onGoDrive, onClose }: DisconnectSheetProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // 진행 중인 드라이브 때문에 막혔을 때만 정리 버튼을 보여 준다
  const [driveBlocked, setDriveBlocked] = useState(false)

  const handleDisconnect = async () => {
    setBusy(true)
    setNotice(null)
    const result = await onDisconnect()
    setError(result?.message ?? null)
    setDriveBlocked(result?.activeDrive ?? false)
    setBusy(false)
  }

  const handleClearDrive = async () => {
    setBusy(true)
    try {
      const outcome = await onClearActiveDrive()
      if (outcome === 'goDrive') return onGoDrive()
      setError(null)
      setDriveBlocked(false)
      setNotice(NOTICES[outcome])
    } catch {
      setError(CLEAR_FAILED)
    } finally {
      setBusy(false)
    }
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
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <div className={styles.confirmActions}>
          {driveBlocked && (
            <Button variant="secondary" size="cta" disabled={busy} onClick={() => void handleClearDrive()}>
              진행 중인 드라이브 정리하기
            </Button>
          )}
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
