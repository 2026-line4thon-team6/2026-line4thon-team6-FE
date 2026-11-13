import mascotHello from '@/assets/images/onboarding/mascot-hello.webp'
import Button from '@/components/Button/Button'
import type { ConsentType } from '@/types/auth'
import styles from './GreetingPage.module.scss'

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
      <img className={styles.mascot} src={mascotHello} alt="" width={216} height={256} />
      <h1 className={styles.message}>
        {'반가워요! '}
        <br />
        저는 붕붕이라고 해요.
      </h1>

      <div className={styles.consent}>
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

      <Button className={styles.button} size="cta" disabled={!agreed} onClick={onNext}>
        만나서 반가워!
      </Button>
    </main>
  )
}

export default WelcomePage
