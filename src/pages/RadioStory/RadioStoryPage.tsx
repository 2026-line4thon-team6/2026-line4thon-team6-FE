import { useRef } from 'react'
import playIcon from '@/assets/icons/radio-play.svg'
import heroImage from '@/assets/images/radio/radio-hero.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { RadioEpisode } from '@/types/radio'
import styles from './RadioStoryPage.module.scss'

interface RadioStoryPageProps {
  status: 'loading' | 'ready' | 'notFound' | 'error'
  episode: RadioEpisode | null
  onBack: () => void
  onRetry: () => void
  // 음성을 불러오지 못했을 때 (임시 URL 만료 등). 사연을 다시 조회해 새 URL을 받는다
  onAudioError: () => void
}

// 마이 > 라디오 사연 보관함 > 사연 상세 (Figma My_UI > 보관함 상세 812:10416)
// 붕붕이 DJ가 읽어 준 방송 문구를 보여 주고, 음성을 다시 들을 수 있다
function RadioStoryPage({ status, episode, onBack, onRetry, onAudioError }: RadioStoryPageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioUrl = episode?.audioUrl ?? null

  const play = () => {
    // 브라우저가 재생을 막으면(자동 재생 정책 등) 조용히 무시한다
    audioRef.current?.play().catch(() => {})
  }

  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>라디오</h1>
      </header>

      <img className={styles.hero} src={heroImage} alt="" />

      <main className={styles.sheet}>
        {status === 'loading' && (
          <p className={styles.message} role="status">
            사연을 불러오는 중이에요.
          </p>
        )}
        {status === 'notFound' && (
          <p className={styles.message} role="alert">
            삭제되었거나 볼 수 없는 사연이에요.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.message} role="alert">
            <p>사연을 불러오지 못했어요.</p>
            <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        )}

        {status === 'ready' && episode && (
          <section aria-labelledby="radio-story-heading">
            <div className={styles.titleRow}>
              <h2 id="radio-story-heading" className={styles.heading}>
                사연 재생 중
              </h2>
              <div className={styles.controls}>
                <button type="button" className={styles.control} aria-label="재생" disabled={!audioUrl} onClick={play}>
                  <img src={playIcon} alt="" />
                </button>
                <button type="button" className={styles.control} aria-label="정지" disabled={!audioUrl} onClick={stop}>
                  <span className={styles.stopIcon} />
                </button>
              </div>
            </div>

            <p className={styles.script}>{episode.broadcastText ?? episode.story}</p>

            {audioUrl && <audio ref={audioRef} src={audioUrl} preload="none" onError={onAudioError} />}
          </section>
        )}
      </main>
    </div>
  )
}

export default RadioStoryPage
