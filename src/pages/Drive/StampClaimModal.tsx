import { useId } from 'react'
import restAreaImage from '@/assets/images/stamp/rest-area.webp'
import Button from '@/components/Button/Button'
import LocationSearchButton from '@/components/LocationSearchButton/LocationSearchButton'
import Modal from '@/components/Modal/Modal'
import SearchBar from '@/components/SearchBar/SearchBar'
import styles from './StampClaimModal.module.scss'

interface StampClaimModalProps {
  // 현재 위치로 찾았거나 검색에서 고른 휴게소 이름
  restAreaName: string | null
  locating?: boolean
  submitting?: boolean
  onLocate: () => void
  onSearchOpen: () => void
  onSubmit: () => void
  onClose: () => void
}

// 휴게소 도장 찍기 팝업 (Figma 289:27538 · 342:8901)
function StampClaimModal({
  restAreaName,
  locating = false,
  submitting = false,
  onLocate,
  onSearchOpen,
  onSubmit,
  onClose,
}: StampClaimModalProps) {
  const titleId = useId()

  return (
    <Modal aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.content}>
        <img className={styles.image} src={restAreaImage} alt="" />
        <h2 id={titleId} className={styles.title}>
          휴게소 도장 찍기
        </h2>
        <p className={styles.description}>방문한 휴게소를 찾아 도장을 찍어주세요.</p>

        <LocationSearchButton className={styles.locate} onClick={onLocate} disabled={locating} />
        {/* 누르면 휴게소 검색 화면을 연다 */}
        <SearchBar
          className={styles.search}
          value={restAreaName ?? ''}
          onValueChange={() => {}}
          onSearch={onSearchOpen}
          onClick={onSearchOpen}
          readOnly
          placeholder="휴게소 이름을 검색해주세요."
          aria-label="휴게소 이름"
        />

        <div className={styles.actions}>
          <Button className={styles.cancel} variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={!restAreaName || submitting}>
            도장찍기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default StampClaimModal
