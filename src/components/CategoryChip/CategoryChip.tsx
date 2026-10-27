import type { ButtonHTMLAttributes } from 'react'
import styles from './CategoryChip.module.scss'

interface CategoryChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  label: string
  selected: boolean
}

// 홈 '스마트 탐색 & 큐레이션'의 카테고리 필터 칩
function CategoryChip({ icon, label, selected, className, type = 'button', ...props }: CategoryChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[styles.chip, selected && styles.selected, className].filter(Boolean).join(' ')}
      {...props}
    >
      <img className={styles.icon} src={icon} alt="" />
      {label}
    </button>
  )
}

export default CategoryChip
