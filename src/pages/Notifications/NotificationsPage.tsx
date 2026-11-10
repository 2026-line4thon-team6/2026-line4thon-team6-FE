import type { NavTab } from '@/components/BottomNav/BottomNav'
import BottomNavBar from '@/components/BottomNavBar/BottomNavBar'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { Notification } from '@/types/notification'
import { daysBetween, formatRelativeTime } from '@/utils/relativeTime'
import styles from './NotificationsPage.module.scss'

// 이 일수 미만이면 '최근 7일', 그 이상은 '최근 30일' (30일이 지난 알림은 서버가 내려주지 않는다)
const RECENT_DAYS = 7

export type NotificationsStatus = 'loading' | 'ready' | 'error'

interface NotificationsPageProps {
  status: NotificationsStatus
  notifications: Notification[] // 최신순
  // 응답 meta.serverTime. '며칠 전'과 기간 구분은 기기 시계가 아니라 이 값을 기준으로 계산한다
  serverTime: string | null
  hasMore: boolean
  loadingMore: boolean
  onBack: () => void
  // 탭한 알림. 읽음 처리와 대상 화면 이동은 부모가 맡는다
  onNotificationClick: (notification: Notification) => void
  onRetry: () => void
  onLoadMore: () => void
  onTabChange?: (tab: NavTab) => void
}

function NotificationsPage({
  status,
  notifications,
  serverTime,
  hasMore,
  loadingMore,
  onBack,
  onNotificationClick,
  onRetry,
  onLoadMore,
  onTabChange,
}: NotificationsPageProps) {
  const now = serverTime ?? new Date().toISOString()
  const groups = [
    { id: 'recent', label: '최근 7일', items: notifications.filter((item) => daysBetween(item.createdAt, now) < RECENT_DAYS) },
    { id: 'older', label: '최근 30일', items: notifications.filter((item) => daysBetween(item.createdAt, now) >= RECENT_DAYS) },
  ].filter((group) => group.items.length > 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>알림</h1>
      </header>

      <main className={styles.content}>
        {status === 'loading' && (
          <p className={styles.message} role="status">
            알림을 불러오고 있어요.
          </p>
        )}

        {status === 'error' && (
          <div className={styles.message} role="alert">
            <p>알림을 불러오지 못했어요.</p>
            <button type="button" className={styles.textButton} onClick={onRetry}>
              다시 시도
            </button>
          </div>
        )}

        {status === 'ready' && groups.length === 0 && <p className={styles.message}>아직 받은 알림이 없어요.</p>}

        {status === 'ready' &&
          groups.map(({ id, label, items }) => (
            <section key={id} className={styles.group} aria-labelledby={`notifications-${id}`}>
              <h2 id={`notifications-${id}`} className={styles.groupLabel}>
                {label}
              </h2>
              <ul className={styles.list}>
                {items.map((item) => {
                  const unread = item.readAt === null
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={[styles.item, unread && styles.unread].filter(Boolean).join(' ')}
                        onClick={() => onNotificationClick(item)}
                      >
                        <span className={styles.itemHead}>
                          <span className={styles.itemTitle} role="heading" aria-level={3}>
                            {item.title}
                          </span>
                          <time className={styles.itemTime} dateTime={item.createdAt}>
                            {formatRelativeTime(item.createdAt, now)}
                          </time>
                        </span>
                        <span className={styles.itemBody}>{item.body}</span>
                        {unread && <span className={styles.srOnly}>읽지 않음</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

        {status === 'ready' && hasMore && (
          <button type="button" className={styles.textButton} disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? '불러오는 중…' : '더 보기'}
          </button>
        )}
      </main>

      <BottomNavBar active="home" onChange={onTabChange} />
    </div>
  )
}

export default NotificationsPage
