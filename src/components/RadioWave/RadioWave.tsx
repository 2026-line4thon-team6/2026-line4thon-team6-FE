import styles from './RadioWave.module.scss'

function RadioWave({ className }: { className?: string }) {
  return (
    <span className={[styles.wave, className].filter(Boolean).join(' ')} aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

export default RadioWave
