import { useId, useState } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import { ACTIVE_DRIVE_MESSAGE } from '@/utils/withdrawError'
import styles from './WithdrawSheet.module.scss'

// redirecting: 카카오 본인 확인 화면으로 이동 중 · withdrawn: 목 서버에서 바로 탈퇴됨
// activeDrive: 진행 중인 드라이브가 있어 막힘 · failed: 본인 확인을 시작하지 못함
export type WithdrawOutcome = 'redirecting' | 'withdrawn' | 'activeDrive' | 'failed'

interface WithdrawSheetProps {
  onWithdraw: () => Promise<WithdrawOutcome>
  onClose: () => void
}

const ERRORS: Partial<Record<WithdrawOutcome, string>> = {
  activeDrive: ACTIVE_DRIVE_MESSAGE,
  failed: '본인 확인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

// 회원 탈퇴 확인 시트 (Figma 시안 없음 — 로그아웃 시트와 같은 모양). 백엔드 명세 deleteAccount의 정리 범위를 안내한다
function WithdrawSheet({ onWithdraw, onClose }: WithdrawSheetProps) {
  const checkId = useId()
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setBusy(true)
    setError(null)
    const outcome = await onWithdraw()
    // 카카오 화면으로 이동하는 중이면 버튼을 막아 둔 채로 둔다
    if (outcome === 'redirecting' || outcome === 'withdrawn') return
    setBusy(false)
    setError(ERRORS[outcome] ?? null)
  }

  return (
    <BottomSheet aria-label="정말 탈퇴하시겠어요?" showClose={false} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>정말 탈퇴하시겠어요?</h2>
        <ul className={styles.list}>
          <li>연인과의 커플 연결이 해제돼요.</li>
          <li>내 프로필 · 보관함(플레이리스트 · 라디오 사연 · 찜) · 내가 쓴 소감과 사진이 삭제돼요.</li>
          <li>연인이 쓴 소감과 사진은 연인에게 남지만, 서로의 기록은 더 이상 볼 수 없어요.</li>
          <li>탈퇴하면 되돌릴 수 없어요.</li>
          <li>탈퇴하려면 카카오로 본인 확인을 한 번 더 해요.</li>
        </ul>
        <label className={styles.check} htmlFor={checkId}>
          <input id={checkId} type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          안내를 모두 확인했어요
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button size="cta" disabled={!agreed || busy} onClick={() => void handleWithdraw()}>
            카카오로 본인 확인하고 탈퇴
          </Button>
          <Button variant="secondary" size="cta" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default WithdrawSheet
