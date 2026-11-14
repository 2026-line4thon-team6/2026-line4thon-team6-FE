import pinIcon from '@/assets/icons/recent-pin.svg'
import deleteIcon from '@/assets/icons/delete-small.svg'
import styles from './RecentSearchItem.module.scss'

interface RecentSearchItemProps {
  keyword: string // 예) 서울 반포 한강공원
  date: string // 표시용 날짜. 예) 10.25
  onSelect: () => void
  onDelete: () => void
  className?: string
}

// 장소 검색의 최근 검색어 한 줄. 목록(ul > li) 안에서 쓴다
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
