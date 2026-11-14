import closeIcon from '@/assets/icons/close-small.svg'
import { formatApproachDistance } from '@/utils/driveStats'
import styles from './RestAreaAlert.module.scss'

interface RestAreaAlertProps {
  name: string
  meters: number
  onClose: () => void
  className?: string
}

// 마지막 글자에 받침이 있으면 '이', 없으면 '가'
const subjectParticle = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가'
}

// 휴게소 접근 알림 (Figma 289:30057). 누르면 아무 동작 없이 닫기만 된다 (기능명세 04 ⑤)
function RestAreaAlert({ name, meters, onClose, className }: RestAreaAlertProps) {
  return (
    <p className={[styles.alert, className].filter(Boolean).join(' ')} role="status">
      전방 {formatApproachDistance(meters)} 앞에 {name}
      {subjectParticle(name)} 있어요.
      <button type="button" className={styles.close} onClick={onClose} aria-label="휴게소 알림 닫기">
        <img src={closeIcon} alt="" />
      </button>
    </p>
  )
}

export default RestAreaAlert
