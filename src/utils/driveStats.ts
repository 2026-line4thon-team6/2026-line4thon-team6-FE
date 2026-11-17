import type { DriveStat } from '@/components/DriveStats/DriveStats'
import type { Drive } from '@/types/drive'

export function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분 ${seconds % 60}초`
}

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

export function formatApproachDistance(meters: number) {
  if (meters >= 1000) return `${Number((meters / 1000).toFixed(1))}km`
  return `${Math.max(100, Math.round(meters / 100) * 100)}m`
}

export function formatArrival(iso: string) {
  const date = new Date(iso)
  return `${date.getHours()}시 ${date.getMinutes()}분`
}

// TODO: 백엔드 드라이브 응답의 estimatedArrivalAt이 항상 null이라 경로 소요 시간으로 대신 계산한다. 채워지면 제거
function fallbackArrival(drive: Drive, routeDurationSeconds: number | null) {
  if (!drive.startedAt || routeDurationSeconds === null) return null
  const seconds = routeDurationSeconds + drive.metrics.pausedDurationSeconds
  return new Date(new Date(drive.startedAt).getTime() + seconds * 1000).toISOString()
}

export function getDriveStats(drive: Drive | null, extraSeconds = 0, routeDurationSeconds: number | null = null): DriveStat[] {
  const started = drive !== null && drive.status !== 'PREPARING'
  const arrival = drive
    ? (drive.metrics.estimatedArrivalAt ?? (started ? fallbackArrival(drive, routeDurationSeconds) : null))
    : null

  return [
    {
      label: '주행 시간',
      value: started ? formatElapsed(drive.metrics.activeDurationSeconds + extraSeconds) : '-분 -초',
    },
    { label: '이동 거리', value: started ? formatDistance(drive.metrics.distanceMeters) : '-km' },
    { label: '예상 도착 시간', value: arrival ? formatArrival(arrival) : '-시 -분' },
  ]
}
