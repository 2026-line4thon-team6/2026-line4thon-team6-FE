import type { ButtonHTMLAttributes } from 'react'
import backIcon from '@/assets/icons/back.svg'
import shareIcon from '@/assets/icons/share.svg'
import styles from './GlassIconButton.module.scss'

const ICONS = {
  back: backIcon,
  share: shareIcon,
}

interface GlassIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: keyof typeof ICONS
  'aria-label': string
}

// 상세 페이지 상단 이미지 위에 올라가는 36px 원형 글래스 버튼 (뒤로가기, 공유하기)
function GlassIconButton({ icon, className, type = 'button', ...props }: GlassIconButtonProps) {
  return (
    <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
      <img src={ICONS[icon]} alt="" />
    </button>
  )
}

export default GlassIconButton
