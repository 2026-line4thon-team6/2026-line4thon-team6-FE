import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import styles from './LogoutSheet.module.scss'

interface LogoutSheetProps {
  onLogout: () => void
  onClose: () => void
}

// 로그아웃 확인 바텀시트 (Figma: 로그아웃). 시안에 닫기 버튼이 없어 손잡이 · 바깥 영역 · 취소로 닫는다
function LogoutSheet({ onLogout, onClose }: LogoutSheetProps) {
  return (
    <BottomSheet aria-label="로그아웃 하시겠습니까?" showClose={false} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>로그아웃 하시겠습니까?</h2>
        <p className={styles.description}>
          로그아웃해도 저장된 드라이브 기록은
          <br />
          그대로 유지돼요.
        </p>
        <div className={styles.actions}>
          <Button size="cta" onClick={onLogout}>
            로그아웃
          </Button>
          <Button variant="secondary" size="cta" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default LogoutSheet
