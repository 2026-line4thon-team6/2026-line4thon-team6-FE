import { useId } from 'react'
import highwayPinIcon from '@/assets/icons/pin-highway.svg'
import coralStamp from '@/assets/images/stamp/stamp-coral.webp'
import lockedStamp from '@/assets/images/stamp/stamp-locked.webp'
import Modal from '@/components/Modal/Modal'
import type { RestAreaDetail } from '@/types/restArea'
import styles from './RestAreaDetailModal.module.scss'

interface RestAreaDetailModalProps {
  detail: RestAreaDetail
  onClose: () => void
}

// 휴게소 상세 팝업 (Figma 289:20356). 대표 메뉴 데이터가 없으면 메뉴 칸 없이 보여 준다
function RestAreaDetailModal({ detail, onClose }: RestAreaDetailModalProps) {
  const titleId = useId()
  const { restArea, introduction, menus, detailsAvailable } = detail

  return (
    <Modal aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.content}>
        <p className={styles.highway}>
          <img src={highwayPinIcon} alt="" />
          {restArea.highwayName}
        </p>
        <div className={styles.summary}>
          <h2 id={titleId} className={styles.name}>
            {restArea.name}
          </h2>
          {introduction && <p className={styles.introduction}>{introduction}</p>}
          <img
            className={styles.badge}
            src={restArea.earned ? coralStamp : lockedStamp}
            alt={restArea.earned ? '도장 획득' : '도장 미획득'}
          />
        </div>

        {detailsAvailable && menus.length > 0 && (
          <section className={styles.menus} aria-labelledby={`${titleId}-menus`}>
            <h3 id={`${titleId}-menus`} className={styles.menusTitle}>
              이 곳의 대표 메뉴
            </h3>
            <ul className={styles.menuGrid}>
              {menus.map((menu) => (
                <li key={menu.name} className={styles.menu}>
                  {menu.imageUrl ? <img className={styles.menuImage} src={menu.imageUrl} alt="" /> : <span className={styles.menuImage} />}
                  <span className={styles.menuText}>
                    <span className={styles.menuName}>{menu.name}</span>
                    {menu.description && <span className={styles.menuDescription}>{menu.description}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  )
}

export default RestAreaDetailModal
