import type { ButtonHTMLAttributes } from 'react'
import backIcon from '@/assets/icons/back.svg'
import closeIcon from '@/assets/icons/close-glass.svg'
import exitIcon from '@/assets/icons/exit.svg'
import locateIcon from '@/assets/icons/locate.svg'
import menuIcon from '@/assets/icons/menu.svg'
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
  menu: menuIcon,
}

interface GlassIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: keyof typeof ICONS
  'aria-label': string
}

function GlassIconButton({ icon, className, type = 'button', ...props }: GlassIconButtonProps) {
  return (
    <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
      <img src={ICONS[icon]} alt="" />
    </button>
  )
}

export default GlassIconButton
