import type { DriveStat } from '@/components/DriveStats/DriveStats'
import type { Drive } from '@/types/drive'

export function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분 ${seconds % 60}초`
}

// 예상 시간은 분까지만 (Figma 경로 설정하기: '1시간 20분')
export function formatEstimatedDuration(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}분`
  return `${hours}시간 ${minutes}분`
}

export function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)}km`
}

// 휴게소 접근 알림. 1km 이상은 소수 한 자리 km(2.0 → 2km), 미만은 100m 단위
export function formatApproachDistance(meters: number) {
  if (meters >= 1000) return `${Number((meters / 1000).toFixed(1))}km`
  return `${Math.max(100, Math.round(meters / 100) * 100)}m`
}

export function formatArrival(iso: string) {
  const date = new Date(iso)
  return `${date.getHours()}시 ${date.getMinutes()}분`
}

// 주행 전에는 값 대신 '-분 -초' 같은 자리 표시를 보여준다 (Figma 첫 진입 화면)
export function getDriveStats(drive: Drive | null, extraSeconds = 0): DriveStat[] {
  const started = drive !== null && drive.status !== 'PREPARING'
  const arrival = drive?.metrics.estimatedArrivalAt ?? null

  return [
    {
      label: '주행 시간',
      value: started ? formatElapsed(drive.metrics.activeDurationSeconds + extraSeconds) : '-분 -초',
    },
    { label: '이동 거리', value: started ? formatDistance(drive.metrics.distanceMeters) : '-km' },
    { label: '예상 도착 시간', value: arrival ? formatArrival(arrival) : '-시 -분' },
  ]
}
