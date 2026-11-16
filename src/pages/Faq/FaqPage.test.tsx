import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_FAQS } from '@/mocks/faq'
import FaqPage from './FaqPage'

// API 명세 GET /faqs 기준. 시안이 없어 다른 마이 하위 화면(보관함 · 약관)과 같은 틀을 쓴다
type Props = ComponentProps<typeof FaqPage>

// 답변은 줄마다 문단으로 나뉘므로 첫 줄로 찾는다
const answerOf = (index: number) => MOCK_FAQS[index].answer.split('\n')[0]

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onBack: vi.fn(), onRetry: vi.fn() }
  render(<FaqPage status="ready" faqs={MOCK_FAQS} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

it('제목을 보여 주고 뒤로가기를 누르면 돌아간다', async () => {
  const { user, onBack } = renderPage()

  expect(screen.getByRole('heading', { level: 1, name: '자주 묻는 질문' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(onBack).toHaveBeenCalled()
})

describe('질문 목록', () => {
  it('질문을 순서대로 보여 주고, 처음에는 답변을 접어 둔다', () => {
    renderPage()

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(MOCK_FAQS.length)
    expect(items[0]).toHaveTextContent(MOCK_FAQS[0].question)
    expect(screen.getByRole('button', { name: MOCK_FAQS[0].question })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(answerOf(0))).not.toBeInTheDocument()
  })

  it('질문을 누르면 답변이 펼쳐지고, 다시 누르면 접힌다', async () => {
    const { user } = renderPage()
    const question = screen.getByRole('button', { name: MOCK_FAQS[0].question })

    await user.click(question)
    expect(question).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(answerOf(0))).toBeVisible()

    await user.click(question)
    expect(question).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(answerOf(0))).not.toBeInTheDocument()
  })

  it('여러 질문을 함께 펼쳐 볼 수 있다', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: MOCK_FAQS[0].question }))
    await user.click(screen.getByRole('button', { name: MOCK_FAQS[1].question }))

    expect(screen.getByText(answerOf(0))).toBeInTheDocument()
    expect(screen.getByText(answerOf(1))).toBeInTheDocument()
  })

  it('답변의 줄바꿈을 문단으로 나눠 보여 준다', async () => {
    const { user } = renderPage({
      faqs: [{ id: 'faq-x', question: '줄바꿈 질문', answer: '첫 줄\n둘째 줄', order: 1 }],
    })

    await user.click(screen.getByRole('button', { name: '줄바꿈 질문' }))

    expect(screen.getByText('첫 줄')).toBeInTheDocument()
    expect(screen.getByText('둘째 줄')).toBeInTheDocument()
  })

  it('답변의 Markdown(번호 목록 · 굵게)을 목록과 강조로 보여 준다', async () => {
    const { user } = renderPage({
      faqs: [{ id: 'faq-md', question: '목록 질문', answer: '이렇게 해 주세요.\n1. **마이** 화면 열기\n2. 프로필 누르기', order: 1 }],
    })

    await user.click(screen.getByRole('button', { name: '목록 질문' }))

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      expect.arrayContaining(['마이 화면 열기', '프로필 누르기']),
    )
    expect(screen.getByText('마이').tagName).toBe('STRONG')
  })
})

describe('상태', () => {
  it('불러오는 중이면 안내한다', () => {
    renderPage({ status: 'loading', faqs: [] })

    expect(screen.getByRole('status')).toHaveTextContent('자주 묻는 질문을 불러오는 중이에요.')
  })

  it('등록된 질문이 없으면 안내한다', () => {
    renderPage({ faqs: [] })

    expect(screen.getByText('아직 등록된 질문이 없어요.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', faqs: [] })

    expect(screen.getByRole('alert')).toHaveTextContent('자주 묻는 질문을 불러오지 못했어요.')
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
