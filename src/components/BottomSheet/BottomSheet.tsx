import type { ReactNode } from 'react'
import CloseButton from '@/components/CloseButton/CloseButton'
import useOverlay from '@/hooks/useOverlay'
import styles from './BottomSheet.module.scss'

interface BottomSheetProps {
  'aria-label': string
  onClose: () => void
  children: ReactNode
  // 우측상단 닫기
  showClose?: boolean
  className?: string
}

// 화면 아래에서 올라오는 시트. 어두운 배경 · 닫기 버튼 · Esc로 닫는다
function BottomSheet({ 'aria-label': ariaLabel, onClose, children, showClose = true, className }: BottomSheetProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={ref}
        className={[styles.sheet, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {showClose && <CloseButton className={styles.close} onClick={onClose} />}
        {children}
      </div>
    </div>
  )
}

export default BottomSheet
