import { useState } from 'react'
import driverImage from '@/assets/images/card/character-driver.webp'
import passengerImage from '@/assets/images/card/character-passenger.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import DriveConfirmModal from '@/pages/Drive/DriveConfirmModal'
import type { GameQuestion } from '@/types/game'
import styles from './BalanceGamePage.module.scss'

type Choice = 'A' | 'B'
type Role = 'DRIVER' | 'PASSENGER'

interface BalanceGamePageProps {
  status: 'generating' | 'playing' | 'completed' | 'error'
  question: GameQuestion | null
  names: Record<Role, string | null>
  choices: Record<Role, Choice | null>
  busy: boolean
  onChoose: (role: Role, choice: Choice) => void
  onNext: () => void
  onRetry: () => void
  onAbandon: () => void
}

const ROLES: { role: Role; fallback: string; image: string }[] = [
  { role: 'DRIVER', fallback: '운전자', image: driverImage },
  { role: 'PASSENGER', fallback: '동승자', image: passengerImage },
]

function BalanceGamePage({
  status,
  question,
  names,
  choices,
  busy,
  onChoose,
  onNext,
  onRetry,
  onAbandon,
}: BalanceGamePageProps) {
  const [confirming, setConfirming] = useState(false)
  const answered = choices.DRIVER !== null || choices.PASSENGER !== null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={() => setConfirming(true)} />
        <h1 className={styles.title}>밸런스 게임</h1>
      </header>

      <main className={styles.main}>
        {status === 'generating' && (
          <p className={styles.message} role="status">
            밸런스 게임 문제를 만들고 있어요.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.message} role="alert">
            <p>문제를 만들지 못했어요.</p>
            <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        )}

        {status !== 'generating' && status !== 'error' && question && (
          <>
            <h2 className={styles.prompt}>{question.prompt}</h2>

            <div className={styles.options}>
              {(['A', 'B'] as const).map((key) => (
                <div key={key} className={styles.option}>
                  <span className={styles.optionKey}>{key}</span>
                  <span className={styles.optionText}>{key === 'A' ? question.optionA : question.optionB}</span>
                </div>
              ))}
            </div>

            <ul className={styles.players}>
              {ROLES.map(({ role, fallback, image }) => {
                const label = names[role] || fallback
                return (
                  <li key={role} className={styles.player}>
                    <span className={`${styles.who} ${styles[role]}`}>
                      <img src={image} alt="" />
                      <span className={styles.name}>{label}</span>
                    </span>
                    <span className={styles.chips} role="group" aria-label={`${label} 선택`}>
                      {(['A', 'B'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={styles.chip}
                          aria-pressed={choices[role] === key}
                          onClick={() => onChoose(role, key)}
                        >
                          {key}
                        </button>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className={styles.actions}>
          {status === 'playing' && (
            <Button size="cta" disabled={!answered || busy} onClick={onNext}>
              다음 문제
            </Button>
          )}
          <Button size="cta" variant="secondary" onClick={() => setConfirming(true)}>
            게임 중단하기
          </Button>
        </div>
      </main>

      {confirming && (
        <DriveConfirmModal
          title="게임을 중단하시겠어요?"
          description="게임을 중단하면 게임 진행상황은 초기화됩니다."
          cancelLabel="그만하기"
          confirmLabel="계속하기"
          cancelWidth={96}
          onCancel={onAbandon}
          onConfirm={() => setConfirming(false)}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

export default BalanceGamePage
