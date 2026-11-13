import { type ReactNode, useEffect, useState } from 'react'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import styles from './OnboardingStep.module.scss'

interface OnboardingStepProps {
  title: string // 상단 가운데 제목 (예: 이름 입력)
  question: string // 줄바꿈(\n)으로 두 줄 질문
  onBack: () => void
  children: ReactNode
  footer: ReactNode // 다음 · 건너뛰기 버튼
}

// 키보드가 올라오면 가려진 높이만큼 버튼을 올린다. iOS 사파리는 키보드가 떠도 화면 높이(innerHeight)가 그대로라 visualViewport로 잰다
function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)))
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}

// 가입 질문 화면 공통 틀 (기능명세서 L4~L8). 뒤로가기 · 제목 / 질문 / 입력 / 아래 버튼
function OnboardingStep({ title, question, onBack, children, footer }: OnboardingStepProps) {
  const keyboardInset = useKeyboardInset()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>{title}</h1>
      </header>

      <main className={styles.content}>
        {/* 두 줄 질문은 위로 올려 입력칸 높이를 다른 단계와 맞춘다 (Figma 484:14207) */}
        <h2 className={[styles.question, question.includes('\n') && styles.twoLine].filter(Boolean).join(' ')}>
          {question}
        </h2>
        {children}
      </main>

      <footer
        className={styles.footer}
        data-keyboard={keyboardInset > 0 || undefined}
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset + 17 } : undefined}
      >
        {footer}
      </footer>
    </div>
  )
}

export default OnboardingStep
