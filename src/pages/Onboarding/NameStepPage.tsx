import { useId, useRef } from 'react'
import Button from '@/components/Button/Button'
import { limitChars } from '@/utils/limitLength'
import OnboardingStep from './OnboardingStep'
import styles from './OnboardingStep.module.scss'

// 기능명세서: 6자 이내, 이모지 · 특수문자 허용 (서버는 1~20자)
const MAX_CHARS = 6

interface NameStepPageProps {
  title: string
  question: string
  label: string // 입력칸 이름 (화면에는 안내 문구로 보인다)
  value: string
  onChange: (value: string) => void
  onBack: () => void
  onNext: (name: string) => void // 앞뒤 공백을 뺀 값
  submitting?: boolean // 마지막 단계(붕붕이 이름)에서 가입 정보를 저장하는 중
  error?: string | null
}

// L4 닉네임 입력 · L8 붕붕이 이름. 들어오면 키보드가 올라오고, 다음 버튼은 키보드 바로 위에 붙는다
function NameStepPage({ title, question, label, value, onChange, onBack, onNext, submitting, error }: NameStepPageProps) {
  const errorId = useId()
  // 한글 조합 중에 자르면 글자가 깨지므로 조합이 끝난 뒤 자른다
  const composing = useRef(false)
  const name = value.trim()
  const disabled = !name || submitting

  const submit = () => {
    if (!disabled) onNext(name)
  }

  return (
    <OnboardingStep
      title={title}
      question={question}
      onBack={onBack}
      footer={
        <Button size="cta" disabled={disabled} onClick={submit}>
          {submitting ? '저장 중' : '다음'}
        </Button>
      }
    >
      <form
        className={styles.field}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <input
          className={styles.input}
          value={value}
          placeholder={label}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoFocus
          autoComplete="off"
          enterKeyHint="next"
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={(event) => {
            composing.current = false
            onChange(limitChars(event.currentTarget.value, MAX_CHARS))
          }}
          onChange={(event) => {
            const next = event.target.value
            onChange(composing.current ? next : limitChars(next, MAX_CHARS))
          }}
        />
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </OnboardingStep>
  )
}

export default NameStepPage
