import { useId } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './DriveConfirmModal.module.scss'

interface DriveConfirmModalProps {
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
  cancelWidth: number
  confirmDisabled?: boolean
  onCancel: () => void
  onConfirm: () => void
  onClose: () => void
}

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
