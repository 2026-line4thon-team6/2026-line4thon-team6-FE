import Button from '@/components/Button/Button'
import type { ConsentType } from '@/types/auth'
import styles from './GreetingPage.module.scss'
import WavingMascot from './WavingMascot'

interface WelcomePageProps {
  agreed: boolean
  onAgreeChange: (agreed: boolean) => void
  onNext: () => void
  onOpenDocument: (type: ConsentType) => void
}

// L2 환영 · 약관 동의. 필수 동의(이용약관 · 개인정보 처리방침)에 체크해야 넘어간다.
// Figma에는 체크박스가 없어 기능명세서 기준으로 넣었다 (디자인 확인 요청)
function WelcomePage({ agreed, onAgreeChange, onNext, onOpenDocument }: WelcomePageProps) {
  return (
    <main className={styles.page}>
      <WavingMascot />
      {/* 붕붕이가 점프하는 동안 문구가, 손을 흔들 즈음 동의 · 버튼이 올라온다 */}
      <h1 className={`${styles.message} ${styles.reveal}`}>
        {'반가워요! '}
        <br />
        저는 붕붕이라고 해요.
      </h1>

      <div className={`${styles.consent} ${styles.reveal} ${styles.revealLate}`}>
        <label className={styles.check}>
          <input type="checkbox" checked={agreed} onChange={(event) => onAgreeChange(event.target.checked)} />
          <span>(필수) 이용약관 및 개인정보 처리방침에 동의해요</span>
        </label>
        <p className={styles.documents}>
          <button type="button" aria-label="이용약관 보기" onClick={() => onOpenDocument('TERMS')}>
            이용약관
          </button>
          <button type="button" aria-label="개인정보 처리방침 보기" onClick={() => onOpenDocument('PRIVACY')}>
            개인정보 처리방침
          </button>
        </p>
      </div>

      <Button
        className={`${styles.button} ${styles.reveal} ${styles.revealLate}`}
        size="cta"
        disabled={!agreed}
        onClick={onNext}
      >
        만나서 반가워!
      </Button>
    </main>
  )
}

export default WelcomePage
