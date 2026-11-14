import { useEffect, useState } from 'react'
import loadingRing from '@/assets/icons/dj/loading-ring.svg'
import stepDone from '@/assets/icons/dj/step-done.svg'
import stepWaiting from '@/assets/icons/dj/step-waiting.svg'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import styles from './PlaylistGeneratingPage.module.scss'

const STEPS = ['선택한 키워드 분석 완료', '음악 서비스에서 곡 찾는 중...', '도착 시간에 맞춰 구성 중...']

// 서버가 단계별 진행을 알려 주지 않아 시간에 따라 넘긴다 (기능명세 08 '해당 동작은 보류')
const STEP_MS = 1200

interface PlaylistGeneratingPageProps {
  onCancel: () => void
  onBack: () => void
}

function PlaylistGeneratingPage({ onCancel, onBack }: PlaylistGeneratingPageProps) {
  const [current, setCurrent] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => setCurrent((value) => Math.min(value + 1, STEPS.length - 1)), STEP_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>DJ 플레이리스트</h1>
      </header>

      <main className={styles.content} role="status">
        <div className={styles.visual} aria-hidden>
          <img className={styles.ring} src={loadingRing} alt="" />
          <span className={styles.bars}>
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>

        <p className={styles.message}>
          <span className={styles.wait}>잠시만 기다려주세요..</span>
          <span className={styles.lead}>
            우리에게 꼭 맞는 <em className={styles.highlight}>맞춤 플레이리스트</em>가
            <br />
            만들어지고 있어요!
          </span>
        </p>

        <ul className={styles.steps}>
          {STEPS.map((label, index) => {
            const done = index < current
            return (
              <li key={label} className={styles.step}>
                <img className={done ? undefined : styles.spinner} src={done ? stepDone : stepWaiting} alt="" />
                {label}
              </li>
            )
          })}
        </ul>
      </main>

      <footer className={styles.footer}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          생성 취소
        </button>
      </footer>
    </div>
  )
}

export default PlaylistGeneratingPage
