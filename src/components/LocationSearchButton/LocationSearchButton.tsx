import type { ButtonHTMLAttributes } from 'react'
import pinIcon from '@/assets/icons/pin-coral.svg'
import styles from './LocationSearchButton.module.scss'

function LocationSearchButton({
  className,
  type = 'button',
  children = '현재 위치로 찾기',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
      <img src={pinIcon} alt="" />
      {children}
    </button>
  )
}

export default LocationSearchButton
