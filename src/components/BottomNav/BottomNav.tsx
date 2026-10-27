import navBg from '@/assets/icons/nav-bg.svg'
import navCar from '@/assets/icons/nav-car.svg'
import navDriveCircle from '@/assets/icons/nav-drive-circle.svg'
import navHome from '@/assets/icons/nav-home.svg'
import navHomeActive from '@/assets/icons/nav-home-active.svg'
import navMap from '@/assets/icons/nav-map.svg'
import navMapActive from '@/assets/icons/nav-map-active.svg'
import navMy from '@/assets/icons/nav-my.svg'
import navMyActive from '@/assets/icons/nav-my-active.svg'
import navStudio from '@/assets/icons/nav-studio.svg'
import navStudioActive from '@/assets/icons/nav-studio-active.svg'
import styles from './BottomNav.module.scss'

export type NavTab = 'home' | 'map' | 'studio' | 'my'

const TABS: { value: NavTab; label: string; icon: string; activeIcon: string }[] = [
  { value: 'home', label: '홈', icon: navHome, activeIcon: navHomeActive },
  { value: 'map', label: '기록 지도', icon: navMap, activeIcon: navMapActive },
  { value: 'studio', label: '스튜디오', icon: navStudio, activeIcon: navStudioActive },
  { value: 'my', label: '마이', icon: navMy, activeIcon: navMyActive },
]

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
  onDriveClick: () => void
}

function BottomNav({ active, onChange, onDriveClick }: BottomNavProps) {
  const renderTab = ({ value, label, icon, activeIcon }: (typeof TABS)[number]) => {
    const isActive = value === active
    return (
      <li key={value}>
        <button
          type="button"
          className={[styles.tab, isActive && styles.active].filter(Boolean).join(' ')}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => onChange(value)}
        >
          <span className={styles.icon}>
            <img src={isActive ? activeIcon : icon} alt="" />
          </span>
          {label}
        </button>
      </li>
    )
  }

  return (
    <nav className={styles.nav} aria-label="메인 메뉴">
      <img className={styles.background} src={navBg} alt="" />
      <ul className={styles.list}>
        {TABS.slice(0, 2).map(renderTab)}
        <li>
          <button type="button" className={styles.drive} onClick={onDriveClick}>
            <span className={styles.driveCircle}>
              <img src={navDriveCircle} alt="" />
              <img className={styles.driveCar} src={navCar} alt="" />
            </span>
            드라이브
          </button>
        </li>
        {TABS.slice(2).map(renderTab)}
      </ul>
    </nav>
  )
}

export default BottomNav
