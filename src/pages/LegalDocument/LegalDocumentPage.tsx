import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import MarkdownText from '@/components/MarkdownText/MarkdownText'
import type { LegalDocumentStatus } from '@/hooks/useLegalDocument'
import type { LegalDocument, LegalDocumentType } from '@/types/legal'
import { toLegalMarkdown } from '@/utils/legalMarkdown'
import styles from './LegalDocumentPage.module.scss'

// 불러오기 전에도 헤더에 보여 줄 문서 제목 (응답의 title과 같다)
const TITLES: Record<LegalDocumentType, string> = {
  PRIVACY: '개인정보 처리방침',
  TERMS: '이용 약관',
  OPEN_SOURCE: '오픈소스 라이선스',
}

interface LegalDocumentPageProps {
  type: LegalDocumentType
  status: LegalDocumentStatus
  document: LegalDocument | null
  onBack: () => void
  onRetry: () => void
}

// 마이 화면의 개인정보 처리방침 · 이용 약관 · 오픈소스 라이선스 문서
function LegalDocumentPage({ type, status, document, onBack, onRetry }: LegalDocumentPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>{document?.title ?? TITLES[type]}</h1>
      </header>

      <main className={styles.body}>
        {status === 'ready' && document ? (
          <MarkdownText className={styles.content} text={toLegalMarkdown(document.content)} />
        ) : status === 'notFound' ? (
          // 서버에 아직 등록되지 않은 문서라 다시 시도해도 같으므로 버튼 없이 안내만 한다
          <p className={styles.message}>아직 준비 중인 문서예요.</p>
        ) : status === 'error' ? (
          <div className={styles.message} role="alert">
            <p>문서를 불러오지 못했어요.</p>
            <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        ) : (
          <p className={styles.message} role="status">
            문서를 불러오는 중이에요.
          </p>
        )}
      </main>
    </div>
  )
}

export default LegalDocumentPage
