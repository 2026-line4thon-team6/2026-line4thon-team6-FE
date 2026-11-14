import { useState, type FormEvent } from 'react'
import BottomSheet from '@/components/BottomSheet/BottomSheet'
import Button from '@/components/Button/Button'
import TextField from '@/components/TextField/TextField'
import styles from './DriveNameSheet.module.scss'

// API 명세 D14: 주행 제목 최대 50자
const DRIVE_NAME_MAX_LENGTH = 50

const COPY = {
  create: { title: '드라이브 준비 완료!' },
  edit: { title: '드라이브명 수정하기' },
}

// 받침이 있으면 '이', 없으면 '가' (예: 붕붕이가, 별님이)
function withSubjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return `${word}이(가)`
  return code % 28 === 0 ? `${word}가` : `${word}이`
}

interface DriveNameSheetProps {
  open: boolean
  // create: 홈 '드라이브 시작하기' → 드라이브 모드 진입 / edit: 드라이브 모드 상단 드라이브명 수정
  mode: 'create' | 'edit'
  defaultName?: string
  // create 버튼 문구에 들어가는 붕붕이 이름. 예) '붕붕! 붕붕이가 출발'
  mascotName?: string
  onSubmit: (name: string) => void
  onClose: () => void
}

// 드라이브명 입력 · 수정 바텀시트. 열릴 때마다 새로 마운트되어 입력값이 defaultName으로 초기화된다
function DriveNameSheet({ open, onClose, mode, ...formProps }: DriveNameSheetProps) {
  if (!open) return null

  return (
    <BottomSheet aria-label={COPY[mode].title} onClose={onClose} showClose={false} className={styles.sheet}>
      <DriveNameForm mode={mode} {...formProps} />
    </BottomSheet>
  )
}

function DriveNameForm({
  mode,
  defaultName = '',
  mascotName = '붕붕이',
  onSubmit,
}: Omit<DriveNameSheetProps, 'open' | 'onClose'>) {
  const [name, setName] = useState(defaultName)
  const trimmed = name.trim()
  // 처음 만들 때는 이름 없이 바로 출발할 수 있다 (기능명세 예외처리)
  const canSubmit = mode === 'create' || trimmed.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSubmit) onSubmit(trimmed)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{COPY[mode].title}</h2>
        <p className={styles.description}>오늘의 드라이브에 이름을 붙여주세요.</p>
      </div>

      <TextField
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="예시: 우리의 첫 바다 드라이브"
        aria-label="드라이브명"
        maxLength={DRIVE_NAME_MAX_LENGTH}
        enterKeyHint="done"
        autoFocus={mode === 'edit'}
      />

      <Button
        type="submit"
        size="lg"
        icon={mode === 'create' ? 'car' : undefined}
        className={styles.submit}
        disabled={!canSubmit}
      >
        {mode === 'create' ? `붕붕! ${withSubjectParticle(mascotName)} 출발` : '수정 완료'}
      </Button>
    </form>
  )
}

export default DriveNameSheet
