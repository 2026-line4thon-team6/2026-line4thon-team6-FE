import BottomNav, { type NavTab } from '@/components/BottomNav/BottomNav'
import styles from './BottomNavBar.module.scss'

interface BottomNavBarProps {
  active: NavTab
  onChange?: (tab: NavTab) => void
}

// 화면 하단에 고정되는 네비바. 위치·최대 폭·홈 인디케이터 안전 영역을 처리하고, 모양은 BottomNav가 그린다
function BottomNavBar({ active, onChange }: BottomNavBarProps) {
  return (
    <div className={styles.bar}>
      <BottomNav active={active} onChange={(tab) => onChange?.(tab)} />
    </div>
  )
}

export default BottomNavBar
