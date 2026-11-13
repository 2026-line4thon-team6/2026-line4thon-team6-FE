import kakaoIcon from '@/assets/icons/kakao.svg'
import loginPhoto from '@/assets/images/onboarding/login-photo.webp'
import styles from './LoginPage.module.scss'

interface LoginPageProps {
  status: 'idle' | 'loading'
  error: string | null
  onKakaoLogin: () => void
}

// L1 로그인 메인. 앱 로그인은 카카오만 제공한다 (API 확정 정책 D09 · Figma의 Google 버튼은 넣지 않음)
function LoginPage({ status, error, onKakaoLogin }: LoginPageProps) {
  const loading = status === 'loading'

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <h1 className={styles.logo}>붕붕어스</h1>
          <p className={styles.description}>
            둘만의 드라이브를 더욱
            <br />
            특별하게 만드는 공간
          </p>
          <img className={styles.photo} src={loginPhoto} alt="" width={302} height={252} />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.kakao} disabled={loading} onClick={onKakaoLogin}>
            <img className={styles.kakaoIcon} src={kakaoIcon} alt="" />
            {loading ? '로그인 중' : '카카오로 3초 만에 시작하기'}
          </button>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default LoginPage
