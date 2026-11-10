import navBgHome from '@/assets/icons/nav-bg-home.svg'
import navBgMap from '@/assets/icons/nav-bg-map.svg'
import navBgMy from '@/assets/icons/nav-bg-my.svg'
import navHome from '@/assets/icons/nav-home.svg'
import navHomeActive from '@/assets/icons/nav-home-active.svg'
import navMap from '@/assets/icons/nav-map.svg'
import navMapActive from '@/assets/icons/nav-map-active.svg'
import navMy from '@/assets/icons/nav-my.svg'
import navMyActive from '@/assets/icons/nav-my-active.svg'
import styles from './BottomNav.module.scss'

export type NavTab = 'home' | 'map' | 'my'

// background: 선택된 탭 위치가 볼록하게 솟은 흰 배경
const TABS: { value: NavTab; label: string; icon: string; activeIcon: string; background: string }[] = [
  { value: 'home', label: '홈', icon: navHome, activeIcon: navHomeActive, background: navBgHome },
  { value: 'map', label: '기록 지도', icon: navMap, activeIcon: navMapActive, background: navBgMap },
  { value: 'my', label: '마이', icon: navMy, activeIcon: navMyActive, background: navBgMy },
]

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="메인 메뉴">
      {TABS.map(({ value, background }) => (
        <img key={value} className={styles.background} src={background} alt="" hidden={value !== active} />
      ))}
      <ul className={styles.list}>
        {TABS.map(({ value, label, icon, activeIcon }) => {
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
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
