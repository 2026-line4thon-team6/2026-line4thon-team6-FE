import type { ButtonHTMLAttributes } from 'react'
import mapIcon from '@/assets/icons/route-map.svg'
import styles from './RouteSearchButton.module.scss'

// 드라이브 모드 상단 우측 경로 탐색 버튼. 탭하면 장소 검색 화면으로 이동한다
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
