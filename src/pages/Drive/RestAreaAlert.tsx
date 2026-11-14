import closeIcon from '@/assets/icons/close-small.svg'
import { formatApproachDistance } from '@/utils/driveStats'
import styles from './RestAreaAlert.module.scss'

interface RestAreaAlertProps {
  name: string
  meters: number
  onClose: () => void
  className?: string
}

const subjectParticle = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가'
}

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
