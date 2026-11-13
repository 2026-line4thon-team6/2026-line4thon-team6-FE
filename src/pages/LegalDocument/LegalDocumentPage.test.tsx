import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { mockFetchLegalDocument } from '@/mocks/legal'
import LegalDocumentPage from './LegalDocumentPage'

// Figma 'My_UI > 개인정보 처리방침 · 이용 약관 · 오픈소스' 기준
type Props = ComponentProps<typeof LegalDocumentPage>

const { data: TERMS } = await mockFetchLegalDocument('TERMS')

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onBack: vi.fn(), onRetry: vi.fn() }
  render(<LegalDocumentPage type="TERMS" status="ready" document={TERMS} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('LegalDocumentPage', () => {
  it('문서 제목과, 줄마다 나눈 본문을 표시한다', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '이용 약관' })).toBeInTheDocument()
    expect(screen.getByText('제1조 목적')).toBeInTheDocument()
    expect(screen.getByText('제12조 약관의 변경')).toBeInTheDocument()
  })

  it.each([
    ['PRIVACY', '개인정보 처리방침'],
    ['TERMS', '이용 약관'],
    ['OPEN_SOURCE', '오픈소스 라이선스'],
  ] as const)('불러오는 중에도 %s 문서 제목을 표시한다', (type, title) => {
    renderPage({ type, status: 'loading', document: null })

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('문서를 불러오는 중이에요.')
  })

  it('뒤로가기를 누르면 이전 화면으로 돌아간다', async () => {
    const { user, onBack } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(onBack).toHaveBeenCalled()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', document: null })

    expect(screen.getByRole('alert')).toHaveTextContent('문서를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalled()
  })
})
