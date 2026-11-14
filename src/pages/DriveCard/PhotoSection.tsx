import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import moreIcon from '@/assets/icons/more.svg'
import photoAddIcon from '@/assets/icons/photo-add.svg'
import trashIcon from '@/assets/icons/trash.svg'
import emptyImage from '@/assets/images/card/photo-empty.webp'
import { MAX_PHOTOS, PHOTO_ACCEPT } from '@/hooks/useDriveCard'
import type { CardPhoto } from '@/types/card'
import styles from './PhotoSection.module.scss'

interface PhotoSectionProps {
  photos: CardPhoto[]
  disabled: boolean
  onAdd: (files: File[]) => void
  onRemove: (mediaId: string) => void
  onSwap: () => void
}

interface PhotoInputProps {
  className?: string
  disabled?: boolean
  onAdd: (files: File[]) => void
  role?: 'menuitem'
  children: ReactNode
}

// 앨범에서 사진을 고르는 라벨. 라벨 전체를 누르면 파일 선택 창이 열린다
function PhotoInput({ className, disabled, onAdd, role, children }: PhotoInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // 같은 사진을 다시 골라도 change가 일어나게 한다
    if (files.length > 0) onAdd(files)
  }

  return (
    <label className={className} role={role} aria-disabled={disabled || undefined}>
      {children}
      <input
        className={styles.fileInput}
        type="file"
        accept={PHOTO_ACCEPT.join(',')}
        multiple
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  )
}

// 카드 사진 영역. 사진이 없으면 큰 추가 영역, 있으면 사진 2칸과 더보기 메뉴(사진 추가 · 순서 변경)
function PhotoSection({ photos, disabled, onAdd, onRemove, onSwap }: PhotoSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 바깥을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  if (photos.length === 0) {
    return (
      <PhotoInput className={styles.empty} disabled={disabled} onAdd={onAdd}>
        <span className={styles.emptyArt} aria-hidden>
          <img className={styles.emptyImage} src={emptyImage} alt="" />
          <img className={styles.emptyPlus} src={photoAddIcon} alt="" />
        </span>
        <span className={styles.hidden}>사진 추가하기</span>
      </PhotoInput>
    )
  }

  const full = photos.length >= MAX_PHOTOS
  const canSwap = photos.length >= 2

  const handleAdd = (files: File[]) => {
    setMenuOpen(false)
    onAdd(files)
  }

  const handleSwap = () => {
    if (!canSwap) return
    setMenuOpen(false)
    onSwap()
  }

  return (
    <section className={styles.section} aria-label="드라이브 사진">
      <div ref={menuRef} className={styles.menuArea}>
        <button
          type="button"
          className={styles.moreButton}
          aria-label="사진 메뉴"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={disabled}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <img src={moreIcon} alt="" />
        </button>

        {menuOpen && (
          <div className={styles.menu} role="menu" aria-label="사진 메뉴">
            <PhotoInput role="menuitem" className={styles.menuItem} disabled={full} onAdd={handleAdd}>
              사진 추가하기
            </PhotoInput>
            <hr className={styles.menuDivider} />
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              aria-disabled={!canSwap || undefined}
              onClick={handleSwap}
            >
              순서 변경하기
            </button>
          </div>
        )}
      </div>

      <ul className={styles.photos}>
        {photos.map((photo, index) => (
          <li key={photo.mediaId} className={styles.photo}>
            <img src={photo.url} alt={`드라이브 사진 ${index + 1}`} />
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`${index + 1}번째 사진 삭제`}
              disabled={disabled}
              onClick={() => onRemove(photo.mediaId)}
            >
              <img src={trashIcon} alt="" />
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <PhotoInput className={styles.addTile} disabled={disabled} onAdd={onAdd}>
              <img src={photoAddIcon} alt="" />
              <span className={styles.hidden}>사진 한 장 더 추가하기</span>
            </PhotoInput>
          </li>
        )}
      </ul>
    </section>
  )
}

export default PhotoSection
