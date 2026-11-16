import pinIcon from '@/assets/icons/pin-lg.svg'
import Button from '@/components/Button/Button'
import type { PublicPlace } from '@/types/place'
import styles from './PublicPlacePage.module.scss'

interface PublicPlacePageProps {
  status: 'loading' | 'ready' | 'notFound' | 'error'
  place: PublicPlace | null
  onRetry: () => void
  // 로그인 화면으로 보낸다. 찜 · 연인에게 보내기 · 드라이브는 로그인해야 쓸 수 있다
  onStart: () => void
}

// 공유 링크(/places/:placeId)를 로그인 전 사용자가 열었을 때의 공개 장소 화면.
// 회원 상세(PlaceDetailPage)와 같은 모양을 쓰되, 로그인이 필요한 찜 · 공유 · 보내기 버튼은 두지 않는다
function PublicPlacePage({ status, place, onRetry, onStart }: PublicPlacePageProps) {
  // 어느 상태에서든 앱을 시작할 수 있게 하단 버튼은 항상 둔다 (없는 장소 링크여도 앱으로 이어지게)
  const bottomBar = (
    <div className={styles.bottomBar}>
      <Button onClick={onStart}>붕붕어스 시작하기</Button>
    </div>
  )

  if (status !== 'ready' || !place) {
    return (
      <div className={styles.page}>
        {status === 'loading' ? (
          <p className={styles.message} role="status">
            장소 정보를 불러오고 있어요.
          </p>
        ) : status === 'notFound' ? (
          <div className={styles.message} role="alert">
            <p>장소를 찾을 수 없어요.</p>
            <p className={styles.messageSub}>링크가 잘못되었거나 더 이상 볼 수 없는 장소예요.</p>
          </div>
        ) : (
          <div className={styles.message} role="alert">
            <p>장소 정보를 불러오지 못했어요.</p>
            <button type="button" className={styles.textButton} onClick={onRetry}>
              다시 시도
            </button>
          </div>
        )}
        {bottomBar}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {place.thumbnailUrl ? (
          <img className={styles.heroPhoto} src={place.thumbnailUrl} alt={`${place.name} 사진`} />
        ) : (
          // 사진이 없는 장소는 빈 회색 대신 은은한 코랄 배경을 깐다
          <div className={styles.heroPlaceholder} aria-hidden />
        )}
      </div>

      <main className={styles.content}>
        <p className={styles.badge}>공유받은 드라이브 장소</p>
        <div className={styles.titleText}>
          <h1 className={styles.name}>{place.name}</h1>
          <p className={styles.meta}>
            <img src={pinIcon} alt="" />
            {place.address}
          </p>
        </div>

        {place.introduction && <p className={styles.introduction}>{place.introduction}</p>}

        <section className={styles.promo} aria-labelledby="public-place-promo">
          <h2 id="public-place-promo" className={styles.promoTitle}>
            둘만의 드라이브를 더욱 특별하게
          </h2>
          <p className={styles.promoText}>붕붕어스에서 이 장소를 찜하고, 연인과 함께 드라이브를 떠나 보세요.</p>
        </section>
      </main>

      {bottomBar}
    </div>
  )
}

export default PublicPlacePage
