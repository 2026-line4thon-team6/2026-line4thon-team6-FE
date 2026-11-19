import closeIcon from '@/assets/icons/close-small.svg'
import styles from './AppUpdateBanner.module.scss'

interface AppUpdateBannerProps {
  onUpdate: () => void
  onDismiss: () => void
}

// 새 배포가 올라왔을 때 화면 위쪽에 띄우는 안내. '업데이트'를 누르면 새 버전으로 다시 불러온다
function AppUpdateBanner({ onUpdate, onDismiss }: AppUpdateBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.message}>새 버전이 있어요</span>
      <button type="button" className={styles.update} onClick={onUpdate}>
        업데이트
      </button>
      <button type="button" className={styles.close} aria-label="업데이트 안내 닫기" onClick={onDismiss}>
        <img src={closeIcon} alt="" />
      </button>
    </div>
  )
}

export default AppUpdateBanner
