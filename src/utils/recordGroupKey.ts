import type { RecordDestination } from '@/types/record'

// 소수 5자리 반올림(HALF_UP)을 십진 문자열로 계산한다. 백엔드 BigDecimal.setScale(5, HALF_UP).toPlainString()과 같은 결과
function roundHalfUp5(value: number): string {
  const negative = value < 0
  const [whole, fraction = ''] = Math.abs(value).toString().split('.')
  const digits = BigInt(whole + (fraction + '000000').slice(0, 5))
  const rounded = Number(fraction[5] ?? '0') >= 5 ? digits + 1n : digits
  const text = rounded.toString().padStart(6, '0')
  const result = `${text.slice(0, -5)}.${text.slice(-5)}`
  return negative && rounded !== 0n ? `-${result}` : result
}

// 기록 지도 마커의 groupKey와 같은 규칙으로 기록을 묶는다 (백엔드 RecordService.groupKey).
// 장소 id가 있으면 place:{id}, 없으면 좌표를 소수 5자리로 반올림한 coord:{lat},{lng}. 좌표 없는 목적지는 지도에 없다
export function recordGroupKey(destination: RecordDestination | null): string | null {
  if (!destination) return null
  if (destination.placeId && destination.placeId.trim()) return `place:${destination.placeId}`
  if (!destination.coordinate) return null
  const { latitude, longitude } = destination.coordinate
  return `coord:${roundHalfUp5(latitude)},${roundHalfUp5(longitude)}`
}
