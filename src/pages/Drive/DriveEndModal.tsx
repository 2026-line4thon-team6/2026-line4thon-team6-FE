import { useId } from 'react'
import chevronIcon from '@/assets/icons/chevron-right-coral.svg'
import routeMapIcon from '@/assets/icons/route-map-coral-sm.svg'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './DriveEndModal.module.scss'

interface DriveEndModalProps {
  // 드라이브를 마치는 중 (두 번 끝내지 않게 버튼을 막는다)
  busy: boolean
  // 드라이브를 마치고 카드 작성 화면으로 간다
  onRecord: () => void
  // 드라이브를 마치고 카드를 남기지 않은 채 나간다
  onSkip: () => void
  // 마치지 않고 경로를 고쳐 더 달린다
  onEditRoute: () => void
  onClose: () => void
}

// 드라이브 마치기 팝업 (Figma 1046:10305 · 설명형 + 텍스트 링크)
function DriveEndModal({ busy, onRecord, onSkip, onEditRoute, onClose }: DriveEndModalProps) {
  const titleId = useId()

  return (
    <Modal aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          드라이브를 마치시겠어요?
        </h2>
        <p className={styles.description}>
          기록하러 가면 드라이브가 끝나고
          <br />
          오늘의 추억이 <strong className={styles.highlight}>카드로 남아요</strong>.
        </p>
        <button type="button" className={styles.routeLink} onClick={onEditRoute}>
          <img src={routeMapIcon} alt="" width={16} height={16} />
          경로 수정하기
          <img src={chevronIcon} alt="" width={5.33333} height={10} />
        </button>
        <div className={styles.actions}>
          <Button className={styles.skip} variant="secondary" size="sm" disabled={busy} onClick={onSkip}>
            기록하지 않고 나가기
          </Button>
          <Button size="sm" disabled={busy} onClick={onRecord}>
            기록하러 가기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DriveEndModal
