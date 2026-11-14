import mascotAsk from '@/assets/images/onboarding/mascot-ask.webp'
import Button from '@/components/Button/Button'
import styles from './GreetingPage.module.scss'

interface IntroPageProps {
  onNext: () => void
}

// L3 호칭 질문. '나는...'을 누르면 닉네임 입력(L4)으로 간다
function IntroPage({ onNext }: IntroPageProps) {
  return (
    <main className={styles.page}>
      <img className={`${styles.mascot} ${styles.mascotWide}`} src={mascotAsk} alt="" width={228} height={270} />
      <h1 className={styles.message}>제가 뭐라고 불러드릴까요?</h1>
      <Button className={`${styles.button} ${styles.wideGap}`} size="cta" onClick={onNext}>
        나는...
      </Button>
    </main>
  )
}

export default IntroPage
