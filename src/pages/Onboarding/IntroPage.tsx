import { ViewTransition } from 'react'
import mascotAsk from '@/assets/images/onboarding/mascot-ask.webp'
import Button from '@/components/Button/Button'
import styles from './GreetingPage.module.scss'

interface IntroPageProps {
  onNext: () => void
}

// L3 호칭 질문. '나는...'을 누르면 닉네임 입력(L4)으로 간다.
// L2의 붕붕이가 이 자리로 이어진 뒤 고개를 갸웃한다
function IntroPage({ onNext }: IntroPageProps) {
  return (
    <main className={styles.page}>
      <ViewTransition name="onboarding-mascot" share="onboarding-mascot">
        <img
          className={`${styles.mascot} ${styles.mascotWide} ${styles.tilt}`}
          src={mascotAsk}
          alt=""
          width={228}
          height={270}
        />
      </ViewTransition>
      <h1 className={styles.message}>제가 뭐라고 불러드릴까요?</h1>
      <Button className={`${styles.button} ${styles.wideGap}`} size="cta" onClick={onNext}>
        나는...
      </Button>
    </main>
  )
}

export default IntroPage
