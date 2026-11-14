import coupleImage from '@/assets/images/card/character-couple.webp'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import { formatRemaining } from '@/utils/cardFormat'
import styles from './CardPromptModal.module.scss'

interface CardPromptModalProps {
  variant: 'arrived' | 'pending'
  // 마감이 가장 빠른 카드의 남은 시간. pending에서만 배지로 표시한다
  remainingSeconds?: number
  onConfirm: () => void
  onClose: () => void
}

const COPY = {
  // 드라이브 모드에서 목적지에 도착했을 때 (Figma: 드라이브 끝)
  arrived: {
    lines: ['목적지에 도착했어요!', ['', '드라이브 카드', '를 작성해볼까요?']],
    description: '오늘의 드라이브를 특별한 추억으로 남겨보세요.',
    cancel: '아니요',
    confirm: '카드 작성하기',
  },
  // 홈에 들어왔을 때 24시간 안에 저장하지 않은 카드가 있으면 (Figma: 홈-드라이브 카드 미작성 팝업)
  pending: {
    lines: ['아직 작성하지 않은', ['', '드라이브 카드', '가 있어요']],
    description: '24시간이 지나면 작성 기회가 사라져버려요.',
    cancel: '나중에',
    confirm: '카드 작성하러 가기',
  },
} as const

// 드라이브 카드 작성을 권하는 팝업
function CardPromptModal({ variant, remainingSeconds = 0, onConfirm, onClose }: CardPromptModalProps) {
  const copy = COPY[variant]
  const [first, [, highlight, rest]] = copy.lines

  return (
    <Modal aria-labelledby="card-prompt-title" onClose={onClose}>
      <div className={[styles.content, styles[variant]].join(' ')}>
        <img className={styles.image} src={coupleImage} alt="" />
        {variant === 'pending' && <p className={styles.badge}>남은 시간 {formatRemaining(remainingSeconds)}</p>}
        {/* 강조 글자를 나눠 감싸면 끊어 읽히므로 한 문장으로 읽게 한다 */}
        <h2 id="card-prompt-title" className={styles.title} aria-label={`${first} ${highlight}${rest}`}>
          <span className={styles.line}>{first}</span>{' '}
          <span className={styles.line}>
            <span className={styles.highlight}>{highlight}</span>
            {rest}
          </span>
        </h2>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.actions}>
          <Button className={styles.cancel} variant="secondary" size="sm" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CardPromptModal
