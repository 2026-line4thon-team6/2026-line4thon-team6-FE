import { useState } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import type { Me, UpdateMeRequest } from '@/types/me'
import { formatBirthInput, toIsoDate } from '@/utils/coupleDate'
import styles from './CoupleModals.module.scss'

const MAX_NICKNAME = 20

interface ProfileEditModalProps {
  me: Me
  today: string // YYYY-MM-DD. 이후 날짜는 생년월일로 쓸 수 없다
  // 성공하면 null, 실패하면 안내 문구
  onSave: (body: UpdateMeRequest) => Promise<string | null>
  onClose: () => void
}

// 내 닉네임 · 생년월일 편집 팝업 (Figma: 편집)
function ProfileEditModal({ me, today, onSave, onClose }: ProfileEditModalProps) {
  const [nickname, setNickname] = useState(me.nickname)
  const [birthDate, setBirthDate] = useState(me.birthDate?.replaceAll('-', '.') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = nickname.trim()

  const handleSave = async () => {
    // 비우면 생년월일 삭제
    const birth = birthDate ? toIsoDate(birthDate, today) : null
    if (birthDate && !birth) {
      setError('생년월일을 다시 확인해 주세요.')
      return
    }
    setSaving(true)
    setError(await onSave({ nickname: trimmed, birthDate: birth }))
    setSaving(false)
  }

  return (
    <Modal aria-labelledby="profile-edit-nickname" onClose={onClose}>
      <form
        className={styles.content}
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmed) void handleSave()
        }}
      >
        <div className={styles.fields}>
          <label className={styles.field}>
            <span id="profile-edit-nickname" className={styles.label}>
              닉네임
            </span>
            <input
              className={styles.input}
              value={nickname}
              maxLength={MAX_NICKNAME}
              autoFocus
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>생년월일</span>
            <input
              className={styles.input}
              value={birthDate}
              inputMode="numeric"
              placeholder="YYYY.MM.DD"
              onChange={(event) => setBirthDate(formatBirthInput(event.target.value))}
            />
          </label>
        </div>
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

export default ProfileEditModal
