import playIcon from '@/assets/icons/radio-play.svg'
import heroImage from '@/assets/images/radio/radio-hero.webp'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { RadioEpisode } from '@/types/radio'
import styles from './DriveRadioPage.module.scss'

interface DriveRadioPageProps {
  episode: RadioEpisode | null
  composing: boolean
  playing: boolean
  story: string
  maxLength: number
  generating: 'USER_STORY' | 'RANDOM' | null
  error: string | null
  onStoryChange: (story: string) => void
  onSend: () => void
  onRandom: () => void
  onToggle: () => void
  onStop: () => void
  onNewStory: () => void
  onHalt: () => void
  onMenu: () => void
  onBack: () => void
}

function DriveRadioPage({
  episode,
  composing,
  playing,
  story,
  maxLength,
  generating,
  error,
  onStoryChange,
  onSend,
  onRandom,
  onToggle,
  onStop,
  onNewStory,
  onHalt,
  onMenu,
  onBack,
}: DriveRadioPageProps) {
  const showEpisode = !composing && episode

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>라디오</h1>
        {!showEpisode && (
          <GlassIconButton className={styles.menu} icon="menu" aria-label="보낸 사연 목록" onClick={onMenu} />
        )}
      </header>

      <img className={styles.hero} src={heroImage} alt="" />

      <main className={styles.sheet}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h2 className={styles.heading}>{showEpisode ? '사연 재생 중' : '사연 입력하기'}</h2>
            {!showEpisode && (
              <p className={styles.description}>
                연인과의 추억부터 소소한 일상까지,
                <br />
                여러분의 이야기를 DJ의 목소리로 전해드릴게요.
              </p>
            )}
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.control}
              aria-label={playing ? '일시정지' : '재생'}
              disabled={!episode}
              onClick={onToggle}
            >
              {playing ? <span className={styles.pauseIcon} /> : <img src={playIcon} alt="" />}
            </button>
            <button type="button" className={styles.control} aria-label="정지" disabled={!episode} onClick={onStop}>
              <span className={styles.stopIcon} />
            </button>
          </div>
        </div>

        {showEpisode ? (
          <p className={styles.script}>{episode.broadcastText ?? episode.story}</p>
        ) : (
          <div className={styles.storyBox}>
            <textarea
              aria-label="사연"
              className={styles.textarea}
              value={story}
              maxLength={maxLength}
              placeholder="예) 남자친구에게 고마운 마음을 전하고 싶어요."
              disabled={generating !== null}
              onChange={(event) => onStoryChange(event.target.value)}
            />
            <span className={styles.counter}>
              {story.length} / {maxLength}
            </span>
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {showEpisode ? (
            <>
              <Button size="cta" onClick={onNewStory}>
                새로운 사연 보내기
              </Button>
              <Button size="cta" variant="secondary" onClick={onHalt}>
                중단하기
              </Button>
            </>
          ) : (
            <>
              <Button size="cta" disabled={!story.trim() || generating !== null} onClick={onSend}>
                {generating === 'USER_STORY' ? '방송을 준비하고 있어요…' : '사연 보내기'}
              </Button>
              <Button size="cta" variant="secondary" disabled={generating !== null} onClick={onRandom}>
                {generating === 'RANDOM' ? '방송을 준비하고 있어요…' : '랜덤 사연 START!'}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default DriveRadioPage
