import type { ButtonHTMLAttributes } from 'react'
import carIcon from '@/assets/icons/car.svg'
import carPressedIcon from '@/assets/icons/car-pressed.svg'
import letterIcon from '@/assets/icons/letter.svg'
import letterPressedIcon from '@/assets/icons/letter-pressed.svg'
import styles from './Button.module.scss'

// pressed 아이콘은 버튼 배경색에 맞춘 디테일 색만 다르다
const ICONS = {
  car: { default: carIcon, pressed: carPressedIcon },
  letter: { default: letterIcon, pressed: letterPressedIcon },
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  // lg: 홈 카드 CTA (pill + 그림자) / md: 상세 하단 버튼 / sm: 모달 버튼
  size?: 'lg' | 'md' | 'sm'
  icon?: keyof typeof ICONS
}

function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && (
        <span className={styles.icon} aria-hidden>
          <img className={styles.iconDefault} src={ICONS[icon].default} alt="" />
          <img className={styles.iconPressed} src={ICONS[icon].pressed} alt="" />
        </span>
      )}
      {children}
    </button>
  )
}

export default Button
