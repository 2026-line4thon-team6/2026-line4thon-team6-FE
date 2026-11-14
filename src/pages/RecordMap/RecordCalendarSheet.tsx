import { useState } from 'react'
import chevronIcon from '@/assets/icons/calendar-chevron.svg'
import useOverlay from '@/hooks/useOverlay'
import useRecordCalendar from '@/hooks/useRecordCalendar'
import { formatMonth, getMonthWeeks, shiftMonth, toMonth } from '@/utils/calendar'
import { formatDate } from '@/utils/formatDate'
import styles from './RecordCalendarSheet.module.scss'

interface RecordCalendarSheetProps {
  // 이미 고른 날짜. 있으면 그 달부터 띄운다
  selectedDate: string | null
  // 서울 기준 오늘 (YYYY-MM-DD). 이 날이 있는 달보다 뒤로는 넘길 수 없다
  today: string
  onSelect: (date: string) => void
  onClose: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 기록 지도 - 날짜 검색 달력 (Figma 284:14566). 기록이 있는 날짜만 고를 수 있다
function RecordCalendarSheet({ selectedDate, today, onSelect, onClose }: RecordCalendarSheetProps) {
  const ref = useOverlay<HTMLDivElement>(onClose)
  const lastMonth = toMonth(today)
  const [month, setMonth] = useState(() => toMonth(selectedDate ?? today))
  const { status, recordDates, retry } = useRecordCalendar(month)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} data-testid="record-calendar-backdrop" onClick={onClose} />

      <div ref={ref} className={styles.sheet} role="dialog" aria-modal="true" aria-label="날짜로 기록 검색" tabIndex={-1}>
        <div className={styles.header}>
          <button className={styles.navButton} type="button" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>
            <img src={chevronIcon} alt="" width={8} height={15} />
          </button>
          <h2 className={styles.month} aria-live="polite">
            {formatMonth(month)}
          </h2>
          {month < lastMonth ? (
            <button className={styles.navButton} type="button" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>
              <img className={styles.next} src={chevronIcon} alt="" width={8} height={15} />
            </button>
          ) : (
            <span className={styles.navButton} aria-hidden="true" />
          )}
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className={styles.days}>
          {getMonthWeeks(month)
            .flat()
            .map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />
              const selected = date === selectedDate
              return (
                <button
                  key={date}
                  type="button"
                  className={[styles.day, selected && styles.selected].filter(Boolean).join(' ')}
                  aria-label={formatDate(date)}
                  aria-pressed={selected}
                  disabled={!recordDates.has(date)}
                  onClick={() => onSelect(date)}
                >
                  {Number(date.slice(8))}
                </button>
              )
            })}
        </div>

        {status === 'error' && (
          <p className={styles.error} role="alert">
            날짜를 불러오지 못했어요
            <button className={styles.retry} type="button" onClick={retry}>
              다시 시도
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default RecordCalendarSheet
