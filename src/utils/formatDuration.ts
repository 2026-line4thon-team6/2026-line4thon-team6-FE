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

// 장소 카드 · 상세의 '지역 · 예상 시간' 줄. 서버가 예상 시간을 모르면(null) 지역만 보여 준다 ('경기 시흥시 · --' 대신)
export function formatRegionDuration(region: string, seconds: number | null) {
  return seconds === null ? region : `${region} · ${formatDuration(seconds)}`
}
