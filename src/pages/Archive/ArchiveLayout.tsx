import type { ReactNode } from 'react'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import styles from './ArchiveLayout.module.scss'

// 다음 페이지 더 보기 (알림 목록과 같은 방식). 보관함 3종 화면이 그대로 넘겨받는다
export interface LoadMoreProps {
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

interface ArchiveLayoutProps extends LoadMoreProps {
  title: string
  status: 'loading' | 'ready' | 'error'
  loadingMessage: string
  errorMessage: string
  // 목록이 비었을 때 안내 문구. null이면 목록(children)을 보여 준다
  emptyMessage: string | null
  // 상태와 관계없이 목록 위에 보여 줄 영역 (카테고리 칩, 검색창)
  toolbar?: ReactNode
  onBack: () => void
  onRetry: () => void
  children: ReactNode
}

// 마이 > 보관함 3종(찜한 드라이브 코스 · 플레이리스트 · 라디오 사연)의 공통 틀. 자주 묻는 질문 화면도 같은 틀을 쓴다
function ArchiveLayout({
  title,
  status,
  loadingMessage,
  errorMessage,
  emptyMessage,
  toolbar,
  hasMore = false,
  loadingMore = false,
  onBack,
  onRetry,
  onLoadMore,
  children,
}: ArchiveLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.title}>{title}</h1>
      </header>

      <main className={styles.body}>
        {toolbar}
        {status === 'loading' ? (
          <p className={styles.message} role="status">
            {loadingMessage}
          </p>
        ) : status === 'error' ? (
          <div className={styles.message} role="alert">
            <p>{errorMessage}</p>
            <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        ) : emptyMessage ? (
          <p className={styles.message}>{emptyMessage}</p>
        ) : (
          <>
            {children}
            {hasMore && onLoadMore && (
              <button type="button" className={styles.loadMore} disabled={loadingMore} onClick={onLoadMore}>
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ArchiveLayout
