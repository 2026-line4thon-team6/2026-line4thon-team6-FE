import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './DateWheelPicker.module.scss'

// 한 칸 높이. 선택된 칸이 가운데 오도록 위아래 2칸씩 여백을 둔다
const ITEM_HEIGHT = 38
const SCROLL_SETTLE_MS = 120

interface DateWheelPickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  max: string // 고를 수 있는 마지막 날짜 (보통 오늘)
  minYear?: number
}

interface WheelItem {
  value: number
  label: string
  disabled: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate()
const parse = (date: string) => date.split('-').map(Number) as [number, number, number]

// 년 · 월 · 일 휠. 스크롤해서 멈춘 칸, 누른 칸, 방향키로 값을 고른다
function DateWheelPicker({ value, onChange, max, minYear = 2000 }: DateWheelPickerProps) {
  const [year, month, day] = parse(value)
  const [maxYear, maxMonth, maxDay] = parse(max)

  // 날짜가 그 달을 넘거나 max 이후면 맞춰서 알린다
  const change = (nextYear: number, nextMonth: number, nextDay: number) => {
    let y = nextYear
    let m = nextMonth
    let d = Math.min(nextDay, daysIn(y, m))
    if (y > maxYear || (y === maxYear && m > maxMonth) || (y === maxYear && m === maxMonth && d > maxDay)) {
      ;[y, m, d] = [maxYear, maxMonth, maxDay]
    }
    const next = `${y}-${pad(m)}-${pad(d)}`
    if (next !== value) onChange(next)
  }

  const years: WheelItem[] = Array.from({ length: maxYear - minYear + 1 }, (_, index) => {
    const y = minYear + index
    return { value: y, label: `${y}년`, disabled: false }
  })
  const months: WheelItem[] = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: `${pad(index + 1)}월`,
    disabled: year === maxYear && index + 1 > maxMonth,
  }))
  const days: WheelItem[] = Array.from({ length: daysIn(year, month) }, (_, index) => ({
    value: index + 1,
    label: `${pad(index + 1)}일`,
    disabled: year === maxYear && month === maxMonth && index + 1 > maxDay,
  }))

  return (
    <div className={styles.picker}>
      <span className={styles.band} aria-hidden />
      <WheelColumn label="년" items={years} selected={year} onSelect={(y) => change(y, month, day)} />
      <WheelColumn label="월" items={months} selected={month} onSelect={(m) => change(year, m, day)} />
      <WheelColumn label="일" items={days} selected={day} onSelect={(d) => change(year, month, d)} />
    </div>
  )
}

interface WheelColumnProps {
  label: string
  items: WheelItem[]
  selected: number
  onSelect: (value: number) => void
}

function WheelColumn({ label, items, selected, onSelect }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === selected))

  // 값이 바뀌면 선택된 칸이 가운데 오도록 스크롤을 맞춘다
  useEffect(() => {
    const element = ref.current
    if (element && Math.abs(element.scrollTop - selectedIndex * ITEM_HEIGHT) > 1) {
      element.scrollTop = selectedIndex * ITEM_HEIGHT
    }
  }, [selectedIndex])

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

  // 스크롤이 멈추면 가운데 칸을 고른다. 고를 수 없는 칸이면 원래 자리로 돌아간다
  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const element = ref.current
      if (!element) return
      const index = Math.min(items.length - 1, Math.max(0, Math.round(element.scrollTop / ITEM_HEIGHT)))
      const item = items[index]
      if (item && !item.disabled && item.value !== selected) onSelect(item.value)
      else element.scrollTop = selectedIndex * ITEM_HEIGHT
    }, SCROLL_SETTLE_MS)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const step = event.key === 'ArrowUp' ? -1 : 1
    const next = items[selectedIndex + step]
    if (next && !next.disabled) onSelect(next.value)
  }

  return (
    <div
      ref={ref}
      className={styles.column}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`wheel-${label}-${selected}`}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const distance = Math.abs(index - selectedIndex)
        return (
          <div
            key={item.value}
            id={`wheel-${label}-${item.value}`}
            className={[
              styles.item,
              distance === 0 ? styles.selected : distance === 1 ? styles.near : styles.far,
              item.disabled && styles.disabled,
            ]
              .filter(Boolean)
              .join(' ')}
            role="option"
            aria-selected={distance === 0}
            aria-disabled={item.disabled || undefined}
            onClick={() => !item.disabled && onSelect(item.value)}
          >
            {item.label}
          </div>
        )
      })}
    </div>
  )
}

export default DateWheelPicker
