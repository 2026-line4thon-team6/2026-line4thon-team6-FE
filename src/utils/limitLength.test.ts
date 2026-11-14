import { describe, expect, it } from 'vitest'
import { countChars, limitChars } from './limitLength'

// 기능명세서 L4 · L8: 6자 이내, 이모지 · 특수문자 허용. 이모지 하나는 한 글자로 센다
describe('글자 수 제한', () => {
  it('한글 · 영문 · 특수문자를 한 글자씩 센다', () => {
    expect(countChars('민준!a')).toBe(4)
  })

  it('합쳐진 이모지(가족 · 피부색 · 국기)도 한 글자로 센다', () => {
    expect(countChars('👨‍👩‍👧👍🏽🇰🇷')).toBe(3)
  })

  it('최대 글자 수를 넘으면 뒤를 자른다', () => {
    expect(limitChars('붕붕이최고야호', 6)).toBe('붕붕이최고야')
    expect(limitChars('붕붕😀😀😀😀😀', 6)).toBe('붕붕😀😀😀😀')
    expect(limitChars('붕붕', 6)).toBe('붕붕')
  })
})
