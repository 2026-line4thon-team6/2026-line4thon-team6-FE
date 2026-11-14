import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import DateWheelPicker from '@/components/DateWheelPicker/DateWheelPicker'
import styles from './CoupleSheets.module.scss'

interface StartDateSheetProps {
  initial: string // YYYY-MM-DD
  max: string // 오늘. 미래 날짜는 고를 수 없다
  // 성공하면 null, 실패하면 안내 문구
  onSave: (startDate: string) => Promise<string | null>
  onClose: () => void
}

// 커플 시작일 변경 바텀시트 (로그인의 시작일 입력과 같은 휠)
function StartDateSheet({ initial, max, onSave, onClose }: StartDateSheetProps) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(await onSave(value))
    setSaving(false)
  }

  return (
    <BottomSheet aria-label="커플 시작일 변경" showClose={false} onClose={onClose}>
      <div className={styles.dateContent}>
        <DateWheelPicker value={value} max={max} onChange={setValue} />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button className={styles.dateSave} size="cta" disabled={saving} onClick={() => void handleSave()}>
          저장하기
        </Button>
      </div>
    </BottomSheet>
  )
}

export default StartDateSheet
