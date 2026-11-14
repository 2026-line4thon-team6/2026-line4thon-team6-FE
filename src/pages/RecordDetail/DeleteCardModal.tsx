import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './DeleteCardModal.module.scss'

interface DeleteCardModalProps {
  deleting: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

// 카드 삭제 확인 팝업 (Figma 284:15470). 삭제한 기록은 복구할 수 없다
function DeleteCardModal({ deleting, error, onConfirm, onClose }: DeleteCardModalProps) {
  return (
    <Modal aria-labelledby="delete-card-title" onClose={onClose}>
      <div className={styles.content}>
        <h2 id="delete-card-title" className={styles.title}>
          카드를 삭제하시겠어요?
        </h2>
        <p className={styles.description}>삭제한 드라이브 기록은 복구할 수 없어요.</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button className={styles.cancel} variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" disabled={deleting} onClick={onConfirm}>
            {deleting ? '삭제하는 중…' : '삭제하기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteCardModal
