import type { ButtonHTMLAttributes } from 'react'
import heartIcon from '@/assets/icons/heart.svg'
import heartActiveIcon from '@/assets/icons/heart-active.svg'
import heartBadgeIcon from '@/assets/icons/heart-badge.svg'
import heartBadgeActiveIcon from '@/assets/icons/heart-badge-active.svg'
import styles from './LikeButton.module.scss'

const ICONS = {
  sm: { default: heartBadgeIcon, liked: heartBadgeActiveIcon },
  lg: { default: heartIcon, liked: heartActiveIcon },
}

interface LikeButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onToggle'> {
  liked: boolean
  onToggle: (liked: boolean) => void
  // sm: 스팟 카드 위 하트 / lg: 상세 페이지 글래스 버튼
  size?: 'sm' | 'lg'
}

function LikeButton({ liked, onToggle, size = 'sm', className, ...props }: LikeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
      className={[styles.button, styles[size], className].filter(Boolean).join(' ')}
      onClick={() => onToggle(!liked)}
      {...props}
    >
      <img src={liked ? ICONS[size].liked : ICONS[size].default} alt="" />
    </button>
  )
}

export default LikeButton
