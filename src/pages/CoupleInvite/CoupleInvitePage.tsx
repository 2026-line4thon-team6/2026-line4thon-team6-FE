import { useId, useState } from 'react'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import Toast from '@/components/Toast/Toast'
import styles from './CoupleInvitePage.module.scss'

interface CoupleInvitePageProps {
  // linked: 이미 연인과 연결돼 있음
  status: 'loading' | 'ready' | 'error' | 'linked'
  code: string | null // 내 초대 코드
  onBack: () => void
  onRetry: () => void
  onCopy: (code: string) => Promise<void>
  // 기기 공유 화면을 열었으면 'shared', 지원하지 않아 대신 복사했으면 'copied'
  onShare: (code: string) => Promise<'shared' | 'copied'>
  // 성공하면 null, 실패하면 안내 문구
  onConnect: (code: string) => Promise<string | null>
  // 연결에 성공했을 때 (메인 홈으로 이동)
  onConnected: () => void
  // 코드를 비워 두고 완료를 눌렀을 때 (건너뛰기 → 메인 홈)
  onSkip: () => void
}

// 연인 초대 · 코드 연결 (기능명세서 L9 연인 코드). 온보딩 마지막 단계이자, 연결 전 '연인에게 보내기'를 눌렀을 때 들어온다
function CoupleInvitePage({
  status,
  code,
  onBack,
  onRetry,
  onCopy,
  onShare,
  onConnect,
  onConnected,
  onSkip,
}: CoupleInvitePageProps) {
  const [partnerCode, setPartnerCode] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const errorId = useId()

  const handleShare = async () => {
    if (!code) return
    if ((await onShare(code)) === 'copied') setToast('코드를 복사했어요. 연인에게 보내 주세요.')
  }

  const handleDone = async () => {
    if (connecting) return
    if (!partnerCode.trim()) {
      onSkip()
      return
    }
    setConnecting(true)
    const message = await onConnect(partnerCode)
    setConnecting(false)
    if (message) setError(message)
    else onConnected()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>연인 초대</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.intro}>
          <h2 className={styles.heading}>연인을 초대해보세요!</h2>
          <p className={styles.description}>붕붕어스와 함께할 파트너는 누구인가요?</p>
        </div>

        {status === 'linked' ? (
          <p className={styles.card}>이미 연인과 연결되어 있어요.</p>
        ) : (
          <form
            className={styles.card}
            onSubmit={(event) => {
              event.preventDefault()
              void handleDone()
            }}
          >
            <section className={styles.section} aria-labelledby="couple-invite-my-code">
              <h3 id="couple-invite-my-code" className={styles.sectionTitle}>
                나의 코드
              </h3>
              {status === 'error' ? (
                <div className={styles.loadError}>
                  <p>코드를 불러오지 못했어요.</p>
                  <button type="button" className={styles.retry} onClick={onRetry}>
                    다시 시도
                  </button>
                </div>
              ) : (
                <div className={styles.box}>
                  <span className={styles.code}>{code ?? '--'}</span>
                  <button
                    type="button"
                    className={styles.copy}
                    aria-label="내 코드 복사"
                    disabled={!code}
                    onClick={() => code && void onCopy(code)}
                  >
                    복사
                  </button>
                </div>
              )}
              <Button className={styles.send} size="cta" disabled={!code} onClick={() => void handleShare()}>
                내 코드 보내기
              </Button>
            </section>

            <hr className={styles.divider} />

            <label className={styles.section}>
              <span className={styles.label}>연인의 코드를 알고 있다면?</span>
              <input
                className={styles.box}
                value={partnerCode}
                placeholder="상대방 코드 입력"
                maxLength={80}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => {
                  setPartnerCode(event.target.value)
                  setError(null)
                }}
              />
            </label>
            {error && (
              <p id={errorId} className={styles.error} role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </main>

      <footer className={styles.footer}>
        <Button size="cta" disabled={connecting} onClick={() => void handleDone()}>
          {connecting ? '연결 중' : '완료'}
        </Button>
      </footer>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export default CoupleInvitePage
