import { describe, expect, it } from 'vitest'
import { toLegalMarkdown } from './legalMarkdown'

describe('toLegalMarkdown', () => {
  it('Markdown 제목이 없는 일반 텍스트 약관은 "제N조" 줄을 조항 제목(##)으로 바꾼다', () => {
    const plain = '머리말입니다.\n제1조 목적\n본 약관은 …\n제12조 약관의 변경\n수정될 수 있습니다.'

    expect(toLegalMarkdown(plain)).toBe('머리말입니다.\n## 제1조 목적\n본 약관은 …\n## 제12조 약관의 변경\n수정될 수 있습니다.')
  })

  it('"제 3 조"처럼 띄어 쓴 조항과 앞뒤 공백도 제목으로 본다', () => {
    expect(toLegalMarkdown('  제 3 조 (회원가입)  ')).toBe('## 제 3 조 (회원가입)')
  })

  it('문장 안에 "제1조"가 들어 있으면 제목으로 바꾸지 않는다', () => {
    expect(toLegalMarkdown('이 약관의 제1조에 따라 처리합니다.')).toBe('이 약관의 제1조에 따라 처리합니다.')
  })

  it('이미 Markdown 제목(#)이 있는 본문은 그대로 둔다', () => {
    const markdown = '## 제1조 목적\n- 항목\n제2조 이런 줄도 그대로'

    expect(toLegalMarkdown(markdown)).toBe(markdown)
  })
})
