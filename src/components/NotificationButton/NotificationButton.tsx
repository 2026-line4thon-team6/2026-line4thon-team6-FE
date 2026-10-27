import type { ButtonHTMLAttributes } from 'react'
import bellIcon from '@/assets/icons/bell.svg'
import styles from './NotificationButton.module.scss'

interface NotificationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // 안 읽은 알림이 있으면 우측 상단에 점 표시
  hasUnread?: boolean
}

// 홈 상단 우측 알림(종) 버튼
function NotificationButton({ hasUnread = false, className, type = 'button', ...props }: NotificationButtonProps) {
  return (
    <button
      type={type}
      aria-label={hasUnread ? '알림 (새 알림 있음)' : '알림'}
      className={[styles.button, hasUnread && styles.unread, className].filter(Boolean).join(' ')}
      {...props}
    >
      <img src={bellIcon} alt="" />
    </button>
  )
}

export default NotificationButton
