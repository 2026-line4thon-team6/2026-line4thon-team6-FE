import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import styles from './InstallGuideSheet.module.scss'

interface InstallGuideSheetProps {
  // 'ios': 사파리 공유 메뉴 · 'manual': 브라우저 메뉴
  mode: 'ios' | 'manual'
  onClose: () => void
}

const STEPS: Record<InstallGuideSheetProps['mode'], string[]> = {
  ios: ['화면 아래(아이패드는 위)의 공유 버튼을 눌러요', "'홈 화면에 추가'를 눌러요", "오른쪽 위 '추가'를 누르면 끝!"],
  manual: ['브라우저 메뉴(⋮ 또는 ≡)를 열어요', "'앱 설치' 또는 '홈 화면에 추가'를 눌러요", '카카오톡 등 앱 안에서 열었다면 크롬 · 삼성 인터넷으로 열어 주세요'],
}

// 설치 창을 띄울 수 없는 브라우저에서 홈 화면에 추가하는 방법을 안내한다 (디자인 시안 없음)
function InstallGuideSheet({ mode, onClose }: InstallGuideSheetProps) {
  return (
    <BottomSheet aria-label="홈 화면에 붕붕어스 추가하기" showClose={false} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>홈 화면에 붕붕어스 추가하기</h2>
        <p className={styles.description}>홈 화면 아이콘으로 앱처럼 바로 열 수 있어요.</p>
        <ol className={styles.steps}>
          {STEPS[mode].map((step, index) => (
            <li key={step} className={styles.step}>
              <span className={styles.number} aria-hidden>
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Button className={styles.confirm} size="cta" onClick={onClose}>
          확인
        </Button>
      </div>
    </BottomSheet>
  )
}

export default InstallGuideSheet
