// 커플 페이지의 날짜 표시 · 입력 형식

// '2026-10-20' → '2026.10.20'
export const toDotDate = (date: string) => date.replaceAll('-', '.')

// 기기 날짜(한국 시간) 기준 오늘 'YYYY-MM-DD'
export function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 입력값에서 숫자만 남겨 'YYYY.MM.DD' 모양으로 점을 넣는다 (최대 8자리)
export function formatBirthInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('.')
}

// 'YYYY.MM.DD' → 'YYYY-MM-DD'. 없는 날짜이거나 max(YYYY-MM-DD) 이후이거나 형식이 다르면 null
export function toIsoDate(text: string, max: string) {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(text)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const real =
    date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
  const iso = `${year}-${month}-${day}`
  return real && iso <= max ? iso : null
}
