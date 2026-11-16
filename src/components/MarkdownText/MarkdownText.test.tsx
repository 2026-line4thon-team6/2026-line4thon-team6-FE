import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MarkdownText from './MarkdownText'

describe('MarkdownText', () => {
  it('# · ## · ### 제목을 제목 단계에 맞춰 그린다 (문서 제목 h1 아래이므로 한 단계씩 내린다)', () => {
    render(<MarkdownText text={'# 큰 제목\n## 제1조 목적\n### 세부 항목'} />)

    expect(screen.getByRole('heading', { level: 2, name: '큰 제목' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '제1조 목적' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: '세부 항목' })).toBeInTheDocument()
  })

  it('- 로 시작하는 줄을 묶어 목록으로, 1. 로 시작하는 줄을 번호 목록으로 그린다', () => {
    render(<MarkdownText text={'- 이메일\n- 닉네임\n\n1. 첫째\n2. 둘째'} />)

    const [bullets, numbers] = screen.getAllByRole('list')
    expect(bullets.tagName).toBe('UL')
    expect(within(bullets).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['이메일', '닉네임'])
    expect(numbers.tagName).toBe('OL')
    expect(within(numbers).getAllByRole('listitem')).toHaveLength(2)
  })

  it('**굵게** 를 강조로 그리고, 일반 줄은 문단으로 그린다', () => {
    const { container } = render(<MarkdownText text={'서비스는 **위치정보**를 이용합니다.\n둘째 문단'} />)

    expect(screen.getByText('위치정보').tagName).toBe('STRONG')
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('HTML 태그는 해석하지 않고 글자 그대로 보여 준다', () => {
    const { container } = render(<MarkdownText text={'<img src=x onerror=alert(1)>'} />)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })

  it('--- 는 구분선으로 그린다', () => {
    render(<MarkdownText text={'위\n---\n아래'} />)

    expect(screen.getByRole('separator')).toBeInTheDocument()
  })
})
