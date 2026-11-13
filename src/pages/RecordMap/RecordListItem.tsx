import carIcon from '@/assets/icons/record-car.svg'
import chevronIcon from '@/assets/icons/record-chevron.svg'
import clockIcon from '@/assets/icons/record-clock.svg'
import pinIcon from '@/assets/icons/record-pin.svg'
import type { RecordSummary } from '@/types/record'
import { formatDateParts } from '@/utils/formatDate'
import { formatDistance, formatDriveTime } from '@/utils/formatDrive'
import styles from './RecordListItem.module.scss'

interface RecordListItemProps {
  record: RecordSummary
  onClick: (record: RecordSummary) => void
}

// 기록 목록의 한 줄 (Figma 284:14760). 누르면 기록 상세로 이동한다
function RecordListItem({ record, onClick }: RecordListItemProps) {
  const { year, monthDay, weekday } = formatDateParts(record.driveDate)

  return (
    <button type="button" className={styles.item} onClick={() => onClick(record)}>
      <span className={styles.date}>
        <span className={styles.year}>{year}</span>
        <span className={styles.monthDay}>{monthDay}</span>
        <span className={styles.weekday}>{weekday}</span>
      </span>

      <img className={styles.photo} src={record.thumbnailUrl} alt="" />

      <span className={styles.body}>
        <span className={styles.title}>{record.title}</span>
        <span className={styles.meta}>
          <img src={pinIcon} alt="" width={12} height={15} />
          {record.destination?.name ?? '목적지 미설정'}
        </span>
        <span className={styles.stats}>
          <span className={styles.meta}>
            <img src={carIcon} alt="" width={16} height={14} />
            {formatDistance(record.distanceMeters)}
          </span>
          <span className={styles.meta}>
            <img src={clockIcon} alt="" width={13} height={13} />
            {formatDriveTime(record.activeDurationSeconds)}
          </span>
        </span>
      </span>

      <img className={styles.chevron} src={chevronIcon} alt="" width={8} height={15} />
    </button>
  )
}

export default RecordListItem
