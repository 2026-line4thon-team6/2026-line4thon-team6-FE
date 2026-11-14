import heroImage from '@/assets/images/dj/dj-hero.webp'
import sparkleImage from '@/assets/images/dj/sparkle.webp'
import step1Image from '@/assets/images/dj/step-1.webp'
import step2Image from '@/assets/images/dj/step-2.webp'
import step3Image from '@/assets/images/dj/step-3.webp'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { Keyword } from '@/utils/playlistKeywords'
import styles from './PlaylistPreferencePage.module.scss'

export interface PlaylistPreference {
  moods: string[]
  weather: string | null
  genres: string[]
}

interface PlaylistPreferencePageProps {
  moods: Keyword[]
  weathers: Keyword[]
  genres: Keyword[]
  moodMax: number
  genreMax: number
  value: PlaylistPreference
  submitting?: boolean
  error?: string | null
  onChange: (update: (prev: PlaylistPreference) => PlaylistPreference) => void
  onSubmit: () => void
  onBack: () => void
}

interface ChipGroupProps {
  label: string
  keywords: Keyword[]
  selected: string[]
  onToggle: (code: string) => void
}

function ChipGroup({ label, keywords, selected, onToggle }: ChipGroupProps) {
  return (
    <ul className={styles.chips} aria-label={label}>
      {keywords.map(({ code, emoji, label: name }) => (
        <li key={code}>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={selected.includes(code)}
            onClick={() => onToggle(code)}
          >
            {emoji && <span className={styles.emoji}>{emoji}</span>}
            {name}
          </button>
        </li>
      ))}
    </ul>
  )
}

function PlaylistPreferencePage({
  moods,
  weathers,
  genres,
  moodMax,
  genreMax,
  value,
  submitting = false,
  error = null,
  onChange,
  onSubmit,
  onBack,
}: PlaylistPreferencePageProps) {
  const toggle = (list: string[], code: string, max: number) =>
    list.includes(code) ? list.filter((item) => item !== code) : list.length < max ? [...list, code] : list

  const ready = value.moods.length > 0 && value.weather !== null

  return (
    <div className={styles.page}>
      <img className={styles.hero} src={heroImage} alt="" />

      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>DJ 플레이리스트</h1>
      </header>

      <main className={styles.sheet}>
        <section className={styles.section}>
          <h2 className={styles.question}>
            <img src={step1Image} alt="1" />
            오늘의 분위기는?
          </h2>
          <ChipGroup
            label="분위기"
            keywords={moods}
            selected={value.moods}
            onToggle={(code) => onChange((prev) => ({ ...prev, moods: toggle(prev.moods, code, moodMax) }))}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.question}>
            <img src={step2Image} alt="2" />
            지금 날씨는 어떤가요?
          </h2>
          <ChipGroup
            label="날씨"
            keywords={weathers}
            selected={value.weather ? [value.weather] : []}
            onToggle={(code) => onChange((prev) => ({ ...prev, weather: prev.weather === code ? null : code }))}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.question}>
            <img src={step3Image} alt="3" />
            어떤 장르를 듣고 싶나요?
          </h2>
          <ChipGroup
            label="장르"
            keywords={genres}
            selected={value.genres}
            onToggle={(code) => onChange((prev) => ({ ...prev, genres: toggle(prev.genres, code, genreMax) }))}
          />
        </section>
      </main>

      <footer className={styles.footer}>
        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : (
          <p className={styles.note}>예상 도착 시간에 맞춰 곡 수를 조절할게요!</p>
        )}
        <button type="button" className={styles.submit} onClick={onSubmit} disabled={!ready || submitting}>
          AI 플레이리스트 만들기
          <img src={sparkleImage} alt="" />
        </button>
      </footer>
    </div>
  )
}

export default PlaylistPreferencePage
