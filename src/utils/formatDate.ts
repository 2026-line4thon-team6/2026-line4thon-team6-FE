// 'YYYY-MM-DD' 날짜(업무 날짜, Asia/Seoul)를 '2026년 11월 3일'로 바꾼다.
// 시간대 변환이 없도록 Date로 해석하지 않고 문자열을 그대로 나눈다
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return date

  const [, year, month, day] = match
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}
