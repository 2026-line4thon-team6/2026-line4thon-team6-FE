import { useState } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from './CoupleModals.module.scss'

const MAX_LENGTH = 20

interface MascotNameModalProps {
  initial: string
  // 성공하면 null, 실패하면 안내 문구
  onSave: (name: string) => Promise<string | null>
  onClose: () => void
}

// 붕붕이명 변경 팝업 (Figma: 붕붕이명)
function MascotNameModal({ initial, onSave, onClose }: MascotNameModalProps) {
  const [name, setName] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = name.trim()

  const handleSave = async () => {
    setSaving(true)
    setError(await onSave(trimmed))
    setSaving(false)
  }

  return (
    <Modal aria-labelledby="mascot-name-label" onClose={onClose}>
      <form
        className={styles.content}
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmed) void handleSave()
        }}
      >
        <label className={styles.field}>
          <span id="mascot-name-label" className={styles.label}>
            붕붕이명
          </span>
          <input
            className={styles.input}
            value={name}
            maxLength={MAX_LENGTH}
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button className={styles.cancel} variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" size="sm" disabled={!trimmed || saving}>
            저장하기
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default MascotNameModal
