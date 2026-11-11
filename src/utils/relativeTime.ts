const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// 두 시각(RFC3339 문자열) 사이의 간격(ms). 미래 시각은 0으로 본다
function elapsed(from: string, now: string) {
  return Math.max(0, new Date(now).getTime() - new Date(from).getTime())
}

// 지난 일수 (내림). 기준 시각은 기기 시계가 아니라 서버 시각(meta.serverTime)을 넘긴다
export function daysBetween(from: string, now: string) {
  return Math.floor(elapsed(from, now) / DAY)
}

// '방금 전', '5분 전', '17시간 전', '8일 전'
export function formatRelativeTime(from: string, now: string) {
  const diff = elapsed(from, now)
  if (diff < MINUTE) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  return `${Math.floor(diff / DAY)}일 전`
}
