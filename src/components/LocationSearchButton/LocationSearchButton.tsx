import type { ButtonHTMLAttributes } from 'react'
import pinIcon from '@/assets/icons/pin-coral.svg'
import styles from './LocationSearchButton.module.scss'

// '현재 위치로 찾기' 버튼. 검색어 대신 내 위치 주변으로 찾을 때 쓴다
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
