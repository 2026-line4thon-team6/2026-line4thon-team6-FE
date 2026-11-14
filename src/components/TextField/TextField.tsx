import type { InputHTMLAttributes } from 'react'
import styles from './TextField.module.scss'

// 드라이브명 입력 등
function TextField({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={[styles.input, className].filter(Boolean).join(' ')} {...props} />
}

export default TextField
