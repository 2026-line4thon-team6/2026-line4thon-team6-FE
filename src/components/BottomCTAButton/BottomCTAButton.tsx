import type { ButtonHTMLAttributes } from 'react'
import styles from './BottomCTAButton.module.scss'

function BottomCTAButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props} />
}

export default BottomCTAButton
