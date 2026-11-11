import characterImage from '@/assets/images/character-letter.svg'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './SendToPartnerModal.module.scss'

// confirm: 보낼지 확인 / sending: 전송 중 / failed: 전송 실패(다시 보낼 수 있음) / sent: 전송 완료
export type SendStep = 'confirm' | 'sending' | 'failed' | 'sent'

interface SendToPartnerModalProps {
  step: SendStep
  partnerNickname: string
  onSend: () => void
  onClose: () => void
}

// 장소 상세의 '연인에게 보내기' 확인 팝업과 전송 완료 안내
function SendToPartnerModal({ step, partnerNickname, onSend, onClose }: SendToPartnerModalProps) {
  if (step === 'sent') {
    return (
      <Modal aria-labelledby="send-to-partner-title" onClose={onClose}>
        <div className={styles.sent}>
          <h2 id="send-to-partner-title" className={styles.title}>
            드라이브 코스 전송 완료!
          </h2>
          <p className={styles.description}>
            {partnerNickname}님에게 드라이브 코스를 보냈어요.
            <br />
            함께 즐거운 시간 보내세요!
          </p>
          <Button className={styles.done} size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </Modal>
    )
  }

  const sending = step === 'sending'

  return (
    <Modal aria-labelledby="send-to-partner-title" onClose={onClose}>
      <div className={styles.confirm}>
        <img className={styles.image} src={characterImage} alt="" />
        <h2 id="send-to-partner-title" className={styles.title}>
          {partnerNickname}님에게 이 <span className={styles.highlight}>드라이브 코스</span>를
          <br />
          보내시겠어요?
        </h2>
        <p className={styles.description}>연인에게 함께 가고 싶은 마음을 전달해 보세요.</p>
        {step === 'failed' && (
          <p className={styles.error} role="alert">
            전송하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <div className={styles.actions}>
          <Button className={styles.cancel} variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" disabled={sending} onClick={onSend}>
            {sending ? '보내는 중…' : '보내기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SendToPartnerModal
