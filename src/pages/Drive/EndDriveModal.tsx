import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './EndDriveModal.module.scss'

interface EndDriveModalProps {
  ending?: boolean
  onEditRoute: () => void
  onEnd: () => void
  onClose: () => void
}

// 주행 중 나가기를 눌렀을 때 묻는 팝업 (Figma 드라이브 마치기 289:29957)
function EndDriveModal({ ending = false, onEditRoute, onEnd, onClose }: EndDriveModalProps) {
  return (
    <Modal aria-labelledby="end-drive-title" onClose={onClose}>
      <div className={styles.content}>
        <h2 id="end-drive-title" className={styles.title}>
          드라이브를 마치시겠어요?
        </h2>
        <p className={styles.description}>조금 더 달리고 싶다면 경로를 수정해 보세요.</p>
        <div className={styles.actions}>
          <Button className={styles.editRoute} variant="secondary" size="sm" onClick={onEditRoute}>
            경로 수정
          </Button>
          <Button size="sm" onClick={onEnd} disabled={ending}>
            드라이브 종료
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EndDriveModal
