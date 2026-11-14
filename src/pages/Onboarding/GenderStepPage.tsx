import femaleImage from '@/assets/images/onboarding/gender-female.webp'
import maleImage from '@/assets/images/onboarding/gender-male.webp'
import Button from '@/components/Button/Button'
import OnboardingStep from './OnboardingStep'
import styles from './GenderStepPage.module.scss'

export type Gender = 'MALE' | 'FEMALE'

const OPTIONS: { value: Gender; label: string; image: string; width: number }[] = [
  { value: 'MALE', label: '남자', image: maleImage, width: 151 },
  { value: 'FEMALE', label: '여자', image: femaleImage, width: 159 },
]

interface GenderStepPageProps {
  value: Gender | null
  onChange: (gender: Gender) => void
  onBack: () => void
  onNext: (gender: Gender) => void
}

// L6 성별 선택. 붕붕이 얼굴 · 이름표를 누르면 고른다
function GenderStepPage({ value, onChange, onBack, onNext }: GenderStepPageProps) {
  return (
    <OnboardingStep
      title="성별 선택"
      question="성별을 선택해주세요."
      onBack={onBack}
      footer={
        <Button size="cta" disabled={!value} onClick={() => value && onNext(value)}>
          다음
        </Button>
      }
    >
      <div className={styles.options} role="radiogroup" aria-label="성별">
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.option} style={{ width: option.width }}>
            <input
              className={styles.radio}
              type="radio"
              name="gender"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <img className={styles.image} src={option.image} alt="" width={option.width} height={151} />
            <span className={styles.chip}>{option.label}</span>
          </label>
        ))}
      </div>
    </OnboardingStep>
  )
}

export default GenderStepPage
