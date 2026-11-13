import { useEffect, useRef } from 'react'
import styles from './Toast.module.scss'

interface ToastProps {
  message: string
  onDone: () => void
  duration?: number // ms
}

// 화면 아래쪽에 잠깐 떴다 사라지는 안내 (Figma: '커플 코드가 복사되었습니다.')
function Toast({ message, onDone, duration = 2000 }: ToastProps) {
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), duration)
    return () => clearTimeout(timer)
  }, [message, duration])

  return (
    <p className={styles.toast} role="status">
      {message}
    </p>
  )
}

export default Toast
