import type { ButtonHTMLAttributes } from 'react'
import styles from './BottomCTAButton.module.scss'

// 화면 맨 아래에 붙는 전체 너비 버튼 (예: 경로 설정하기). 홈 인디케이터 영역까지 덮는다
function BottomCTAButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={[styles.button, className].filter(Boolean).join(' ')} {...props} />
}

export default BottomCTAButton
