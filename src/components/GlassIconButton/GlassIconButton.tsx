import type { ButtonHTMLAttributes } from 'react'
import backIcon from '@/assets/icons/back.svg'
import closeIcon from '@/assets/icons/close-glass.svg'
import exitIcon from '@/assets/icons/exit.svg'
import locateIcon from '@/assets/icons/locate.svg'
import pauseIcon from '@/assets/icons/pause.svg'
import shareIcon from '@/assets/icons/share.svg'
import trashIcon from '@/assets/icons/trash-fill.svg'
import styles from './GlassIconButton.module.scss'

const ICONS = {
  back: backIcon,
  share: shareIcon,
  delete: trashIcon,
  close: closeIcon,
  locate: locateIcon,
  exit: exitIcon,
  pause: pauseIcon,
}

interface GlassIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: keyof typeof ICONS
  'aria-label': string
}

// 36px 원형 글래스 버튼
// 상세 페이지 이미지 위: 뒤로가기, 공유하기, 삭제 / 드라이브 모드 지도 위: 닫기, 현재 위치, 나가기, 일시정지
function GlassIconButton({ icon, className, type = 'button', ...props }: GlassIconButtonProps) {
  return (
    <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
      <img src={ICONS[icon]} alt="" />
    </button>
  )
}

export default GlassIconButton
