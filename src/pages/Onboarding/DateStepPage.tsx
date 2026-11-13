import { useId } from 'react'
import Button from '@/components/Button/Button'
import { formatBirthInput, todayString, toIsoDate } from '@/utils/coupleDate'
import OnboardingStep from './OnboardingStep'
import styles from './OnboardingStep.module.scss'

interface DateStepPageProps {
  title: string
  question: string
  label: string
  value: string // 화면에 보이는 'YYYY.MM.DD' (입력 중이면 일부)
  onChange: (value: string) => void
  onBack: () => void
  onNext: (date: string) => void // 'YYYY-MM-DD'
  onSkip?: () => void // 있으면 건너뛰기 버튼을 보여 준다 (L7 연인과 만난 날)
}

// L5 생일 입력 · L7 연인과 만난 날. 숫자 키보드가 올라오고, 입력한 숫자가 앞에서부터 'yyyy.mm.dd'를 채운다
function DateStepPage({ title, question, label, value, onChange, onBack, onNext, onSkip }: DateStepPageProps) {
  const errorId = useId()
  const date = toIsoDate(value, todayString())
  // 8자리를 다 입력했는데 없는 날짜이거나 미래면 안내한다
  const invalid = value.length === 10 && !date

  const submit = () => {
    if (date) onNext(date)
  }

  return (
    <OnboardingStep
      title={title}
      question={question}
      onBack={onBack}
      footer={
        onSkip ? (
          <>
            <Button className={styles.skip} variant="secondary" size="sm" onClick={onSkip}>
              건너뛰기
            </Button>
            <Button size="sm" disabled={!date} onClick={submit}>
              다음
            </Button>
          </>
        ) : (
          <Button size="cta" disabled={!date} onClick={submit}>
            다음
          </Button>
        )
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
          placeholder="yyyy.mm.dd"
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          enterKeyHint="next"
          onChange={(event) => onChange(formatBirthInput(event.target.value))}
        />
        {invalid && (
          <p id={errorId} className={styles.error} role="alert">
            날짜를 다시 확인해 주세요.
          </p>
        )}
      </form>
    </OnboardingStep>
  )
}

export default DateStepPage
