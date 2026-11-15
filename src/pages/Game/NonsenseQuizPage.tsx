import { useState } from 'react'
import eyeIcon from '@/assets/icons/eye.svg'
import checkImage from '@/assets/images/game/answer-check.webp'
import bulbImage from '@/assets/images/game/hint-bulb.webp'
import noteImage from '@/assets/images/game/hint-note.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import DriveConfirmModal from '@/pages/Drive/DriveConfirmModal'
import type { GameQuestion } from '@/types/game'
import styles from './NonsenseQuizPage.module.scss'

export type Winner = 'DRIVER' | 'PASSENGER' | 'NONE'

interface NonsenseQuizPageProps {
  status: 'generating' | 'playing' | 'completed' | 'error'
  question: GameQuestion | null
  names: { DRIVER: string | null; PASSENGER: string | null }
  winner: Winner | null
  busy: boolean
  onRevealHint: () => void
  onRevealAnswer: () => void
  onWinnerChange: (winner: Winner) => void
  onNext: () => void
  onRetry: () => void
  onAbandon: () => void
}

const DEFAULT_NOTE_COUNT = 3

function NonsenseQuizPage({
  status,
  question,
  names,
  winner,
  busy,
  onRevealHint,
  onRevealAnswer,
  onWinnerChange,
  onNext,
  onRetry,
  onAbandon,
}: NonsenseQuizPageProps) {
  const [confirming, setConfirming] = useState(false)
  const answered = !!question?.answerRevealed
  const letters = [...((answered ? question?.answer : question?.hint) ?? '')]
  const noteCount = question?.answerLength || DEFAULT_NOTE_COUNT

  const winners: { value: Winner; label: string }[] = [
    { value: 'DRIVER', label: names.DRIVER || '운전자' },
    { value: 'PASSENGER', label: names.PASSENGER || '동승자' },
    { value: 'NONE', label: '둘다 못 맞혔어요' },
  ]

  const hintLocked = !!question && !question.hintRevealed && !answered
  const cardTitle = (
    <>
      {answered ? (
        <img className={styles.check} src={checkImage} alt="" />
      ) : (
        <img className={styles.bulb} src={bulbImage} alt="" />
      )}
      {answered ? '정답' : '초성 힌트'}
    </>
  )

  const card = question && (
    <div className={styles.card}>
      {hintLocked ? (
        <button type="button" className={styles.cardTitle} aria-label="초성 힌트 보기" onClick={onRevealHint}>
          {cardTitle}
        </button>
      ) : (
        <span className={styles.cardTitle}>{cardTitle}</span>
      )}
      {letters.length > 0 ? (
        <span className={`${styles.letters} ${letters.length > 4 ? styles.many : ''}`}>
          {letters.map((letter, index) => (
            <span key={index} className={styles.letter}>
              {letter}
            </span>
          ))}
        </span>
      ) : (
        <span className={`${styles.notes} ${noteCount > 4 ? styles.many : ''}`} aria-hidden>
          {Array.from({ length: noteCount }, (_, index) => (
            <img key={index} src={noteImage} alt="" />
          ))}
        </span>
      )}
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={() => setConfirming(true)} />
        <h1 className={styles.title}>넌센스 퀴즈</h1>
      </header>

      <main className={styles.main}>
        {status === 'generating' && (
          <p className={styles.message} role="status">
            넌센스 퀴즈 문제를 만들고 있어요.
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

            {card}

            {answered ? (
              <section className={styles.winner} aria-labelledby="nonsense-winner">
                <h3 id="nonsense-winner" className={styles.winnerTitle}>
                  누가 먼저 맞혔나요?
                </h3>
                <div className={styles.winnerOptions}>
                  {winners.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.winnerOption}
                      aria-pressed={winner === value}
                      onClick={() => onWinnerChange(value)}
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <button type="button" className={styles.reveal} onClick={onRevealAnswer}>
                <img src={eyeIcon} alt="" />
                정답 보기
              </button>
            )}
          </>
        )}

        <div className={styles.actions}>
          {status === 'playing' && answered && (
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

export default NonsenseQuizPage
