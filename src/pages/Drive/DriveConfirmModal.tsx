import { useId } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './DriveConfirmModal.module.scss'

interface DriveConfirmModalProps {
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
  // Figma 왼쪽 버튼 폭. 드라이브 마치기 117 · 위치 권한 136
  cancelWidth: number
  confirmDisabled?: boolean
  onCancel: () => void
  onConfirm: () => void
  onClose: () => void
}

// 드라이브 모드의 두 버튼 팝업 (Figma 드라이브 마치기 289:29957 · 위치권한 팝업창 592:10100)
function DriveConfirmModal({
  title,
  description,
  cancelLabel,
  confirmLabel,
  cancelWidth,
  confirmDisabled = false,
  onCancel,
  onConfirm,
  onClose,
}: DriveConfirmModalProps) {
  const titleId = useId()

  return (
    <Modal aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button className={styles.cancel} style={{ flexBasis: cancelWidth }} variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DriveConfirmModal
