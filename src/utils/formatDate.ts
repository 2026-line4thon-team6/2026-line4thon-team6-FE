// 'YYYY-MM-DD' 날짜(업무 날짜, Asia/Seoul)를 '2026년 11월 3일'로 바꾼다.
// 시간대 변환이 없도록 Date로 해석하지 않고 문자열을 그대로 나눈다
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return date

  const [, year, month, day] = match
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 기록 목록의 날짜 칸: '2026-11-03' → { year: '2026년', monthDay: '11.03', weekday: '화' }
export function formatDateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return { year: '', monthDay: date, weekday: '' }

  const [, year, month, day] = match
  // 요일만 구하는 계산이라 UTC로 만들어 기기 시간대의 영향을 받지 않게 한다
  const weekday = WEEKDAYS[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()]
  return { year: `${year}년`, monthDay: `${month}.${day}`, weekday }
}
