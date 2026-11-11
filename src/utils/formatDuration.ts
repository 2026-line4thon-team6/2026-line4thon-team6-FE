// 초 단위 소요 시간을 '약 50분', '약 1시간', '약 1시간 10분'으로 바꾼다. 값이 없으면 '--'
export function formatDuration(seconds: number | null) {
  if (seconds === null) return '--'

  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `약 ${minutes}분`
  if (minutes === 0) return `약 ${hours}시간`
  return `약 ${hours}시간 ${minutes}분`
}
