import type { ButtonHTMLAttributes } from 'react'
import carIcon from '@/assets/icons/car-coral.svg'
import styles from './DriveTitleBar.module.scss'

interface DriveTitleBarProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  title: string
}

// 드라이브 모드 상단 드라이브명 바. 탭하면 드라이브명 수정 시트를 연다
function DriveTitleBar({ title, className, type = 'button', ...props }: DriveTitleBarProps) {
  return (
    <button
      type={type}
      aria-haspopup="dialog"
      aria-label={`${title}, 드라이브명 수정`}
      className={[styles.bar, className].filter(Boolean).join(' ')}
      {...props}
    >
      <img src={carIcon} alt="" />
      <span className={styles.title}>{title}</span>
    </button>
  )
}

export default DriveTitleBar
