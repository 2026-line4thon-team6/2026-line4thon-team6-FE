import type { ButtonHTMLAttributes } from 'react'
import mapIcon from '@/assets/icons/route-map.svg'
import styles from './RouteSearchButton.module.scss'

function RouteSearchButton({
  className,
  type = 'button',
  'aria-label': ariaLabel = '경로 탐색',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...props}
    >
      <img src={mapIcon} alt="" />
    </button>
  )
}

export default RouteSearchButton
