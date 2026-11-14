// 드라이브 카드 화면의 표시 형식

// '2026-11-03' → '2026년 11월 3일'. 업무 날짜(Asia/Seoul)라 시간대 변환 없이 그대로 읽는다
export function formatCardDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일`
}

// 43300 → '43.3km'
export function formatDistance(meters: number) {
  return `${Math.round(meters / 100) / 10}km`
}

// 4800 → '1시간 20분'
export function formatDriveTime(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}

// 3240 → '약 54분'
export function formatPlaylistDuration(seconds: number) {
  return `약 ${Math.round(seconds / 60)}분`
}

// 64800 → '18:00:00'
export function formatRemaining(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}
