import pinIcon from '@/assets/icons/recent-pin.svg'
import deleteIcon from '@/assets/icons/delete-small.svg'
import styles from './RecentSearchItem.module.scss'

interface RecentSearchItemProps {
  keyword: string
  date: string
  onSelect: () => void
  onDelete: () => void
  className?: string
}

function RecentSearchItem({ keyword, date, onSelect, onDelete, className }: RecentSearchItemProps) {
  return (
    <div className={[styles.item, className].filter(Boolean).join(' ')}>
      <button type="button" className={styles.select} onClick={onSelect}>
        <img className={styles.pin} src={pinIcon} alt="" />
        <span className={styles.keyword}>{keyword}</span>
        <span className={styles.date}>{date}</span>
      </button>
      <button type="button" className={styles.delete} aria-label={`${keyword} 최근 검색어 삭제`} onClick={onDelete}>
        <img src={deleteIcon} alt="" />
      </button>
    </div>
  )
}

export default RecentSearchItem
