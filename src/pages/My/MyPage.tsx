import { useState } from 'react'
import chevronIcon from '@/assets/icons/chevron-gray.svg'
import selfieImage from '@/assets/images/my/couple-selfie.webp'
import type { NavTab } from '@/components/BottomNav/BottomNav'
import BottomNavBar from '@/components/BottomNavBar/BottomNavBar'
import type { Couple } from '@/types/couple'
import LogoutSheet from './LogoutSheet'
import styles from './MyPage.module.scss'

export type MyMenu = 'favorites' | 'playlists' | 'stories' | 'privacy' | 'terms' | 'openSource' | 'faq'

// Figma 'My_UI > 마이'의 메뉴 묶음. 아이콘은 시안처럼 이모지를 쓴다
const MENU_GROUPS: { label: string; items: { menu: MyMenu; icon: string; label: string }[] }[] = [
  {
    label: '보관함 메뉴',
    items: [
      { menu: 'favorites', icon: '🗺️', label: '찜한 드라이브 코스' },
      { menu: 'playlists', icon: '🎧', label: '플레이리스트 보관함' },
      { menu: 'stories', icon: '📻', label: '라디오 사연 보관함' },
    ],
  },
  {
    label: '문서 메뉴',
    items: [
      { menu: 'privacy', icon: '📄', label: '개인정보 처리 방침' },
      { menu: 'terms', icon: '📎', label: '이용 약관' },
      { menu: 'openSource', icon: '🗓️', label: '오픈소스 라이선스' },
    ],
  },
]

const EMPTY = '--'

interface MyPageProps {
  status: 'loading' | 'ready' | 'error'
  // 연결된 커플 (GET /couples/me). 연결 전이면 null
  couple: Couple | null
  onProfileClick: () => void
  onMenuClick: (menu: MyMenu) => void
  // 로그아웃 확인 시트에서 '로그아웃'을 눌렀을 때
  onLogout: () => void
  onTabChange: (tab: NavTab) => void
}

// 마이 화면 (하단 네비바 '마이' 탭)
function MyPage({ status, couple, onProfileClick, onMenuClick, onLogout, onTabChange }: MyPageProps) {
  const [logoutOpen, setLogoutOpen] = useState(false)

  const unlinked = status === 'ready' && couple === null
  const title = couple?.mascotName ?? (unlinked ? '연인과 연결해 보세요' : '')
  const summary = couple
    ? `누적 ${Math.round(couple.cumulativeDistanceMeters / 1000)}km · D+${couple.daysTogether}`
    : unlinked
      ? '커플을 연결하면 함께한 기록이 쌓여요'
      : `누적 ${EMPTY}km · D+${EMPTY}`

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <h1 className={styles.hidden}>마이</h1>

        <button type="button" className={styles.profile} onClick={onProfileClick}>
          <img className={styles.selfie} src={selfieImage} alt="" />
          <span className={styles.profileText}>
            <span className={styles.profileTitle}>
              {!unlinked && (
                <span className={styles.heart} aria-hidden>
                  ♥
                </span>
              )}
              <span className={styles.mascot}>{title}</span>
            </span>
            <span className={styles.summary}>{summary}</span>
          </span>
          <img className={styles.chevron} src={chevronIcon} alt="" />
        </button>

        {MENU_GROUPS.map(({ label, items }) => (
          <ul key={label} className={styles.group} aria-label={label}>
            {items.map(({ menu, icon, label: itemLabel }) => (
              <li key={menu}>
                <MenuRow icon={icon} label={itemLabel} onClick={() => onMenuClick(menu)} />
              </li>
            ))}
          </ul>
        ))}

        <ul className={styles.group} aria-label="기타 메뉴">
          <li>
            <MenuRow icon="❓" label="자주 묻는 질문 (FAQ)" onClick={() => onMenuClick('faq')} />
          </li>
          <li>
            <MenuRow icon="🚪" label="로그아웃" onClick={() => setLogoutOpen(true)} />
          </li>
        </ul>
      </main>

      <BottomNavBar active="my" onChange={onTabChange} />

      {logoutOpen && (
        <LogoutSheet
          onLogout={() => {
            setLogoutOpen(false)
            onLogout()
          }}
          onClose={() => setLogoutOpen(false)}
        />
      )}
    </div>
  )
}

interface MenuRowProps {
  icon: string
  label: string
  onClick: () => void
}

function MenuRow({ icon, label, onClick }: MenuRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      {/* 버튼 이름은 메뉴 이름만 읽히도록 이모지는 숨긴다 */}
      <span className={styles.rowIcon} aria-hidden>
        {icon}
      </span>
      <span className={styles.rowLabel}>{label}</span>
      <img className={styles.chevron} src={chevronIcon} alt="" />
    </button>
  )
}

export default MyPage
