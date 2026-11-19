import { useEffect, useRef, useState } from 'react'

// 한 번에 이보다 멀리 가면(경로 재탐색 · GPS 튐) 이어 움직이지 않고 바로 옮긴다
const MAX_GLIDE = 5000
// 이보다 뒤로 가면 바로 옮긴다 (경로 위에서 뒤로 미끄러지는 모습을 보이지 않게)
const MAX_BACKWARD = 30
// 한 번 이어 움직이는 시간의 범위. 보통은 지난 갱신 간격만큼 움직여 다음 위치가 올 때쯤 도착한다
const MIN_DURATION_MS = 100
const MAX_DURATION_MS = 1500
// 갱신 간격은 최근 값의 평균으로 잡고, 조금 더 길게 움직여 다음 위치가 살짝 늦어도 멈춰 서지 않게 한다
const INTERVAL_SMOOTHING = 0.3
const OVERLAP = 1.15

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

// 숫자(경로를 따라 잰 거리 등) 목표가 띄엄띄엄 바뀔 때, 화면에는 프레임마다 이어서 움직이는 값을 준다
function useGlide(target: number | null): number | null {
  const [value, setValue] = useState<number | null>(null)
  const shown = useRef<number | null>(null)
  const lastTargetAt = useRef<number | null>(null)
  const averageInterval = useRef<number | null>(null)

  useEffect(() => {
    let frame = 0
    const now = performance.now()
    const from = shown.current
    if (lastTargetAt.current !== null) {
      // 멈췄다 출발하면 그동안의 긴 간격이 평균을 부풀려 차가 한참 뒤처진다. 한 번의 간격은 최대 이동 시간까지만 센다
      const interval = Math.min(now - lastTargetAt.current, MAX_DURATION_MS)
      const average = averageInterval.current
      averageInterval.current = average === null ? interval : average + (interval - average) * INTERVAL_SMOOTHING
    }
    lastTargetAt.current = target === null ? null : now

    const show = (next: number | null) => {
      shown.current = next
      setValue(next)
    }

    const jump = target === null || from === null || reducedMotion() || Math.abs(target - from) > MAX_GLIDE || target < from - MAX_BACKWARD
    if (jump) {
      frame = requestAnimationFrame(() => show(target))
      return () => cancelAnimationFrame(frame)
    }

    const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, (averageInterval.current ?? MIN_DURATION_MS) * OVERLAP))
    const step = (time: number) => {
      const t = Math.min(1, (time - now) / duration)
      show(from + (target - from) * t)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return value
}

export default useGlide
