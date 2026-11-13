import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import DateStepPage from './DateStepPage'
import GenderStepPage, { type Gender } from './GenderStepPage'
import IntroPage from './IntroPage'
import NameStepPage from './NameStepPage'
import WelcomePage from './WelcomePage'

// 가입 화면 L2~L8 (Figma: Onboarding_UI). L9 연인 초대는 Pages/CoupleInvite
const meta = {
  title: 'Pages/Onboarding',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// L2 환영 · 약관 동의 (484:13599)
export const Welcome: Story = {
  render: function Render() {
    const [agreed, setAgreed] = useState(false)
    return <WelcomePage agreed={agreed} onAgreeChange={setAgreed} onNext={fn()} onOpenDocument={fn()} />
  },
}

// L3 호칭 질문 (484:13672)
export const Intro: Story = {
  render: () => <IntroPage onNext={fn()} />,
}

// L4 닉네임 입력 (484:13697)
export const Nickname: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <NameStepPage
        title="이름 입력"
        question="제가 뭐라고 불러드릴까요?"
        label="닉네임"
        value={value}
        onChange={setValue}
        onBack={fn()}
        onNext={fn()}
      />
    )
  },
}

// L5 생일 입력 (484:13842)
export const Birthday: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <DateStepPage
        title="생년월일 입력"
        question="생일이 언제신가요?"
        label="생일"
        value={value}
        onChange={setValue}
        onBack={fn()}
        onNext={fn()}
      />
    )
  },
}

// L6 성별 선택 (484:13963)
export const GenderSelect: Story = {
  render: function Render() {
    const [value, setValue] = useState<Gender | null>(null)
    return <GenderStepPage value={value} onChange={setValue} onBack={fn()} onNext={fn()} />
  },
}

// L7 연인과 만난 날 (484:14079)
export const Anniversary: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <DateStepPage
        title="기념일 입력"
        question="연인과 언제부터 만났나요?"
        label="만난 날"
        value={value}
        onChange={setValue}
        onBack={fn()}
        onNext={fn()}
        onSkip={fn()}
      />
    )
  },
}

// L8 붕붕이 이름 (484:14207)
export const MascotName: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <NameStepPage
        title="붕붕이명 입력"
        question={'붕붕어스와 함께할\n붕붕이의 이름을 입력해주세요.'}
        label="붕붕이 이름"
        value={value}
        onChange={setValue}
        onBack={fn()}
        onNext={fn()}
      />
    )
  },
}
