// "제1조 목적", "제 3 조 (회원가입)"처럼 줄 맨 앞의 조항 표시. "제1조에 따라…" 같은 문장은 제목이 아니다
const ARTICLE = /^제\s*\d+\s*조(?=\s|\(|$)/
const HAS_HEADING = /^#{1,3}\s/m

// 서버 약관 본문이 Markdown 없이 일반 텍스트로 와도 조항이 나뉘어 보이게 "제N조" 줄을 조항 제목(##)으로 바꾼다.
// 이미 Markdown 제목이 있는 본문은 작성자가 정한 구조를 따르도록 그대로 둔다
export function toLegalMarkdown(content: string): string {
  if (HAS_HEADING.test(content)) return content
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      return ARTICLE.test(trimmed) ? `## ${trimmed}` : line
    })
    .join('\n')
}
