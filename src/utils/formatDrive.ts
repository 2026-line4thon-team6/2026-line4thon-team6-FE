// 주행 거리(m)를 '43.3km', '212km'로 바꾼다. 100km 미만은 소수 첫째 자리까지, '.0'은 뺀다
export function formatDistance(meters: number) {
  const km = meters / 1000
  if (km >= 100) return `${Math.round(km)}km`
  return `${Number(km.toFixed(1))}km`
}

// 주행 시간(초)을 '1시간 20분', '40분', '1시간'으로 바꾼다 (기록 목록 · 상세)
export function formatDriveTime(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}
