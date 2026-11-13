// 달력 계산. 날짜는 업무 날짜(Asia/Seoul) 문자열 'YYYY-MM-DD', 달은 'YYYY-MM'으로 다룬다.
// 기기 시간대의 영향을 받지 않도록 Date는 UTC로만 만든다

const pad = (value: number) => String(value).padStart(2, '0')

function parseMonth(month: string) {
  const [year = 0, monthIndex = 1] = month.split('-').map(Number)
  return { year, monthIndex: monthIndex - 1 }
}

// 일요일부터 시작하는 주 단위 칸. 그 달이 아닌 칸은 null
export function getMonthWeeks(month: string): (string | null)[][] {
  const { year, monthIndex } = parseMonth(month)
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= lastDay; day += 1) cells.push(`${month}-${pad(day)}`)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month)
  const shifted = new Date(Date.UTC(year, monthIndex + delta, 1))
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`
}

export function toMonth(date: string): string {
  return date.slice(0, 7)
}

// '2026-10' → '2026년 10월'
export function formatMonth(month: string): string {
  const { year, monthIndex } = parseMonth(month)
  return `${year}년 ${monthIndex + 1}월`
}

// 서울 기준 오늘 날짜
export function todayInSeoul(now: Date = new Date()): string {
  // en-CA 형식은 'YYYY-MM-DD'
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now)
}
