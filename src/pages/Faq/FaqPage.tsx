import { useId, useState } from 'react'
import chevronIcon from '@/assets/icons/chevron-gray.svg'
import MarkdownText from '@/components/MarkdownText/MarkdownText'
import ArchiveLayout from '@/pages/Archive/ArchiveLayout'
import type { Faq } from '@/types/faq'
import styles from './FaqPage.module.scss'

interface FaqPageProps {
  status: 'loading' | 'ready' | 'error'
  faqs: Faq[]
  onBack: () => void
  onRetry: () => void
}

// 마이 > 자주 묻는 질문. 시안이 없어 보관함 화면과 같은 틀(뒤로가기 + 제목, 상태 안내)을 쓴다
function FaqPage({ status, faqs, onBack, onRetry }: FaqPageProps) {
  // 여러 답변을 함께 펼쳐 비교해 볼 수 있게 하나만 열리는 방식 대신 질문마다 따로 연다
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <ArchiveLayout
      title="자주 묻는 질문"
      status={status}
      loadingMessage="자주 묻는 질문을 불러오는 중이에요."
      errorMessage="자주 묻는 질문을 불러오지 못했어요."
      emptyMessage={faqs.length > 0 ? null : '아직 등록된 질문이 없어요.'}
      onBack={onBack}
      onRetry={onRetry}
    >
      <ul className={styles.list}>
        {faqs.map((faq) => (
          <FaqItem key={faq.id} faq={faq} open={openIds.has(faq.id)} onToggle={() => toggle(faq.id)} />
        ))}
      </ul>
    </ArchiveLayout>
  )
}

interface FaqItemProps {
  faq: Faq
  open: boolean
  onToggle: () => void
}

function FaqItem({ faq, open, onToggle }: FaqItemProps) {
  const answerId = useId()

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.question}
        aria-expanded={open}
        aria-controls={open ? answerId : undefined}
        onClick={onToggle}
      >
        <span className={styles.mark} aria-hidden>
          Q
        </span>
        <span className={styles.questionText}>{faq.question}</span>
        <img className={styles.chevron} data-open={open} src={chevronIcon} alt="" />
      </button>

      {open && (
        <div id={answerId} className={styles.answer}>
          <MarkdownText className={styles.answerText} text={faq.answer} />
        </div>
      )}
    </li>
  )
}

export default FaqPage
