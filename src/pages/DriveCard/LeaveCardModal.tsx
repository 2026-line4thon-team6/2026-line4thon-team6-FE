import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './LeaveCardModal.module.scss'

interface LeaveCardModalProps {
  onLeave: () => void
  onClose: () => void
}

// 카드 작성 중 뒤로가기를 눌렀을 때 묻는 팝업 (Figma: 카드작성 중단 팝업창)
function LeaveCardModal({ onLeave, onClose }: LeaveCardModalProps) {
  return (
    <Modal aria-labelledby="leave-card-title" onClose={onClose}>
      <div className={styles.content}>
        <h2 id="leave-card-title" className={styles.title}>
          작성을 마치시겠습니까?
        </h2>
        <p className={styles.description}>
          드라이브 종료 후 24시간 내로 카드를 저장하지
          <br />
          않으면 드라이브 카드는 사라져요.
        </p>
        <div className={styles.actions}>
          <Button className={styles.leave} variant="secondary" size="sm" onClick={onLeave}>
            나가기
          </Button>
          <Button size="sm" onClick={onClose}>
            계속 작성하기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LeaveCardModal
