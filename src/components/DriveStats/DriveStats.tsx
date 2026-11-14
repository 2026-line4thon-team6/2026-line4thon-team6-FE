import styles from './DriveStats.module.scss'

export interface DriveStat {
  label: string
  value: string
}

interface DriveStatsProps {
  items: DriveStat[]
  className?: string
}

function DriveStats({ items, className }: DriveStatsProps) {
  return (
    <dl className={[styles.stats, className].filter(Boolean).join(' ')}>
      {items.map(({ label, value }) => (
        <div key={label} className={styles.stat}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default DriveStats
