import type { ReactNode } from 'react'
import styles from './MarkdownText.module.scss'

interface MarkdownTextProps {
  text: string
  className?: string
}

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'rule' }
  | { kind: 'paragraph'; text: string }

const HEADING = /^(#{1,3})\s+(.*)$/
const BULLET = /^[-*]\s+(.*)$/
const NUMBERED = /^\d+\.\s+(.*)$/
const RULE = /^-{3,}$/

// 줄 단위로 읽어 블록으로 묶는다. 이어지는 목록 줄은 한 목록으로, 그 밖의 줄은 각각 한 문단이 된다
function parse(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] })
      continue
    }
    if (RULE.test(line)) {
      blocks.push({ kind: 'rule' })
      continue
    }
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    if (bullet || numbered) {
      const ordered = !!numbered
      const item = (bullet ?? numbered)![1]
      const last = blocks.at(-1)
      if (last?.kind === 'list' && last.ordered === ordered) last.items.push(item)
      else blocks.push({ kind: 'list', ordered, items: [item] })
      continue
    }
    blocks.push({ kind: 'paragraph', text: line })
  }
  return blocks
}

// **굵게** 만 강조로 바꾼다. 나머지 글자는 React가 그대로 글자로 넣으므로 HTML이 해석되지 않는다
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  )
}

// 약관처럼 서버가 Markdown 글로 주는 본문을 그린다. 필요한 문법(제목 · 목록 · 굵게 · 구분선 · 문단)만 지원한다.
// 화면에는 이미 문서 제목(h1)이 있으므로 # 는 h2, ## 는 h3, ### 는 h4로 한 단계씩 내린다
function MarkdownText({ text, className }: MarkdownTextProps) {
  return (
    <div className={[styles.markdown, className].filter(Boolean).join(' ')}>
      {parse(text).map((block, index) => {
        switch (block.kind) {
          case 'heading': {
            const Tag = (['h2', 'h3', 'h4'] as const)[block.level - 1]
            return <Tag key={index}>{inline(block.text)}</Tag>
          }
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
              <Tag key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inline(item)}</li>
                ))}
              </Tag>
            )
          }
          case 'rule':
            return <hr key={index} />
          default:
            return <p key={index}>{inline(block.text)}</p>
        }
      })}
    </div>
  )
}

export default MarkdownText
