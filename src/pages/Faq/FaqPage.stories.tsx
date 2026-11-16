import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MOCK_FAQS } from '@/mocks/faq'
import FaqPage from './FaqPage'

const meta = {
  title: 'Pages/Faq',
  component: FaqPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    status: 'ready',
    faqs: MOCK_FAQS,
    onBack: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof FaqPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 질문 · 답변이 길어 여러 줄로 넘어갈 때
export const LongText: Story = {
  args: {
    faqs: [
      {
        id: 'faq-long',
        question: '드라이브 도중에 앱을 닫거나 휴대폰이 꺼지면 기록이 사라지나요?',
        answer:
          '앱을 다시 열면 진행 중이던 드라이브를 이어서 기록해요.\n다만 앱이 닫혀 있던 동안의 이동 경로는 기기와 브라우저 환경에 따라 일부 빠질 수 있어요.',
        order: 1,
      },
      ...MOCK_FAQS,
    ],
  },
}

export const Loading: Story = {
  args: { status: 'loading', faqs: [] },
}

// 서버에 등록된 질문이 아직 없을 때 (faqs.yml이 비어 있는 상태)
export const Empty: Story = {
  args: { faqs: [] },
}

export const LoadError: Story = {
  args: { status: 'error', faqs: [] },
}
