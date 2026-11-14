import styles from './DriveStats.module.scss'

export interface DriveStat {
  label: string // 예) 주행 시간, 예상 주행 시간
  value: string // 예) 32분 18초. 목적지 설정 전에는 '-분 -초'
}

interface DriveStatsProps {
  items: DriveStat[]
  className?: string
}

// 드라이브 모드 지도 위 주행 정보 카드 (주행 시간 · 이동 거리 · 예상 도착 시간)
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
