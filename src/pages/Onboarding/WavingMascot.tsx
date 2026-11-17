import { useState } from 'react'
import mascotBody from '@/assets/images/onboarding/mascot-hello-body.webp'
import mascotHand from '@/assets/images/onboarding/mascot-hello-hand.webp'
import styles from './WavingMascot.module.scss'

interface WavingMascotProps {
  className?: string
}

// L2 환영 붕붕이. 들어오면 한 번 점프하고 오른손을 두 번 흔든다.
// 손은 mascot-hello에서 잘라 낸 레이어라 손목을 축으로 돌린다. 누르면 처음부터 다시 인사한다
function WavingMascot({ className }: WavingMascotProps) {
  const [run, setRun] = useState(0)

  return (
    <div
      className={[styles.stage, className].filter(Boolean).join(' ')}
      data-testid="waving-mascot"
      aria-hidden="true"
      onClick={() => setRun((count) => count + 1)}
    >
      <div key={run} className={styles.jumper}>
        <img className={styles.layer} src={mascotBody} alt="" width={432} height={513} draggable={false} />
        <img
          className={`${styles.layer} ${styles.hand}`}
          src={mascotHand}
          alt=""
          width={432}
          height={513}
          draggable={false}
        />
      </div>
    </div>
  )
}

export default WavingMascot
