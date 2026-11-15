import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RecordPhoto from './RecordPhoto'

describe('RecordPhoto', () => {
  it('사진 주소가 있으면 그 사진을 보여 준다', () => {
    render(<RecordPhoto src="https://api.test/media/1/content?token=t" alt="기록 사진" />)

    expect(screen.getByRole('img', { name: '기록 사진' })).toHaveAttribute('src', 'https://api.test/media/1/content?token=t')
  })

  it('사진이 없는 기록(null)은 공통 기본 일러스트를 보여 준다 (D15)', () => {
    render(<RecordPhoto src={null} alt="기록 사진" />)

    const image = screen.getByRole('img', { name: '기록 사진' })
    expect(image.getAttribute('src')).toMatch(/photo-empty/)
    expect(image).toHaveAttribute('data-empty', 'true')
  })

  it('사진을 불러오지 못하면(서명 링크 만료 등) 기본 일러스트로 바꾼다', () => {
    render(<RecordPhoto src="https://api.test/expired" alt="기록 사진" />)
    const image = screen.getByRole('img', { name: '기록 사진' })

    fireEvent.error(image)

    expect(image.getAttribute('src')).toMatch(/photo-empty/)
  })
})
