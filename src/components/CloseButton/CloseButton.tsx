import type { ButtonHTMLAttributes } from 'react'
import closeIcon from '@/assets/icons/close.svg'
import styles from './CloseButton.module.scss'

function CloseButton({
  className,
  type = 'button',
  'aria-label': ariaLabel = '닫기',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...props}
    >
      <img src={closeIcon} alt="" />
    </button>
  )
}

export default CloseButton
