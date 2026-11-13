// 사람이 보는 글자(grapheme) 단위로 센다. 합쳐진 이모지(👨‍👩‍👧, 🇰🇷)도 한 글자
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null

function splitChars(text: string) {
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text)
}

export function countChars(text: string) {
  return splitChars(text).length
}

export function limitChars(text: string, max: number) {
  const chars = splitChars(text)
  return chars.length > max ? chars.slice(0, max).join('') : text
}
