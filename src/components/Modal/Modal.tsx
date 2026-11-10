import type { ReactNode } from 'react'
import CloseButton from '@/components/CloseButton/CloseButton'
import useOverlay from '@/hooks/useOverlay'
import styles from './Modal.module.scss'

interface ModalProps {
  'aria-labelledby': string
  onClose: () => void
  children: ReactNode
}

// 화면 가운데에 뜨는 팝업. 어두운 배경 · 닫기 버튼 · Esc로 닫는다
function Modal({ 'aria-labelledby': labelledBy, onClose, children }: ModalProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={ref}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <CloseButton className={styles.close} onClick={onClose} />
        {children}
      </div>
    </div>
  )
}

export default Modal
