import navHome from '@/assets/icons/nav-home.svg'
import navHomeActive from '@/assets/icons/nav-home-active.svg'
import navMap from '@/assets/icons/nav-map.svg'
import navMapActive from '@/assets/icons/nav-map-active.svg'
import navMy from '@/assets/icons/nav-my.svg'
import navMyActive from '@/assets/icons/nav-my-active.svg'
import styles from './BottomNav.module.scss'

export type NavTab = 'home' | 'map' | 'my'

const TABS: { value: NavTab; label: string; icon: string; activeIcon: string }[] = [
  { value: 'home', label: '홈', icon: navHome, activeIcon: navHomeActive },
  { value: 'map', label: '기록 지도', icon: navMap, activeIcon: navMapActive },
  { value: 'my', label: '마이', icon: navMy, activeIcon: navMyActive },
]

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="메인 메뉴">
      {/* 선택된 탭 위치가 볼록하게 솟은 흰 배경. 모양은 SCSS에서 탭별 SVG로 그린다 */}
      <div className={`${styles.background} ${styles[active]}`} aria-hidden="true">
        <span />
        <span />
      </div>
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
