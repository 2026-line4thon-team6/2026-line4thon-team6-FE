import { useState } from 'react'
import boardImage from '@/assets/images/game/memory-board.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import DriveConfirmModal from '@/pages/Drive/DriveConfirmModal'
import type { GameQuestion } from '@/types/game'
import styles from './MemoryGamePage.module.scss'

type Role = 'DRIVER' | 'PASSENGER'

interface MemoryGamePageProps {
  status: 'generating' | 'playing' | 'completed' | 'error'
  question: GameQuestion | null
  names: Record<Role, string | null>
  winner: Role | null
  busy: boolean
  noRecords?: boolean
  onWinnerChange: (role: Role) => void
  onNext: () => void
  onRetry: () => void
  onAbandon: () => void
}

function MemoryGamePage({
  status,
  question,
  names,
  winner,
  busy,
  noRecords = false,
  onWinnerChange,
  onNext,
  onRetry,
  onAbandon,
}: MemoryGamePageProps) {
  const [confirming, setConfirming] = useState(false)
  const roles: { role: Role; label: string }[] = [
    { role: 'DRIVER', label: names.DRIVER || '운전자' },
    { role: 'PASSENGER', label: names.PASSENGER || '동승자' },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={() => setConfirming(true)} />
        <h1 className={styles.title}>추억 게임</h1>
      </header>

      <main className={styles.main}>
        {status === 'generating' && (
          <p className={styles.message} role="status">
            추억 게임 문제를 만들고 있어요.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.message} role="alert">
            {noRecords ? (
              <p>
                아직 함께 마친 드라이브가 없어요.
                <br />
                드라이브를 한 번 마치면 추억 게임을 할 수 있어요.
              </p>
            ) : (
              <>
                <p>문제를 만들지 못했어요.</p>
                <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
                  다시 시도
                </Button>
              </>
            )}
          </div>
        )}

        {status !== 'generating' && status !== 'error' && question && (
          <>
            <div className={styles.board}>
              <img src={boardImage} alt="" />
              <h2 className={styles.prompt}>{question.prompt}</h2>
            </div>

            <section className={styles.winner} aria-labelledby="memory-winner">
              <h3 id="memory-winner" className={styles.winnerTitle}>
                누가 먼저 맞혔나요?
              </h3>
              <div className={styles.winnerOptions}>
                {roles.map(({ role, label }) => (
                  <button
                    key={role}
                    type="button"
                    className={styles.winnerOption}
                    aria-pressed={winner === role}
                    onClick={() => onWinnerChange(role)}
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <div className={styles.actions}>
          {status === 'playing' && (
            <Button size="cta" disabled={busy} onClick={onNext}>
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

export default MemoryGamePage
