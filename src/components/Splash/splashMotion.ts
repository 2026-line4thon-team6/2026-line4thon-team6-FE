// 스플래시 움직임 계산. 화면 좌표는 390 x 844 디자인 기준이고, 시간은 기본 타임라인(초) 기준이다.
// 같은 시간을 넣으면 언제나 같은 장면이 나오도록(순수 함수) 만들어 테스트하고 되감을 수 있게 한다

export interface Point {
  x: number
  y: number
}

// 실제 재생은 기본 타임라인을 1.3배 늘려서 한다 (약 4초). 1배는 너무 빨라 정신없다는 피드백
export const TIME_SCALE = 1.3

export const TIMING = {
  roadEnd: 0.6, // 길이 다 그려짐
  driveStart: 0.3,
  driveEnd: 1.75, // 길 끝에 정차
  bung1: 1.52,
  bung2: 1.64,
  eo: 1.92,
  seu: 1.96,
}
// 이때부터 완성된 로고로 멈춰 있고, 앱이 준비되면 전환을 시작한다
export const HOLD = 2.6
// 전환(차 퇴장 · 글자 이동 · 배경 사라짐) 길이
export const TRANSITION = 0.55

// 최종 글자 상자 (390 x 844 기준). 로고 글자 이미지(384 x 94)를 0.62배로 놓는다
export const WORD_BOX = { x: 76, y: 700, width: 238 }

// S자 길: 화면 위 밖에서 곧게 내려와 S자로 꺾여 붕붕이가 멈추는 자리에서 끝난다 (Figma 스플래시 기획)
export const ROAD_D =
  'M 300 -400 L 300 40 C 300 150 96 140 96 250 C 96 360 294 350 294 450 C 294 530 200 540 196 600'

type Segment = [Point, Point, Point, Point]
const SEGMENTS: Segment[] = [
  [
    { x: 300, y: -400 },
    { x: 300, y: -253 },
    { x: 300, y: -107 },
    { x: 300, y: 40 },
  ],
  [
    { x: 300, y: 40 },
    { x: 300, y: 150 },
    { x: 96, y: 140 },
    { x: 96, y: 250 },
  ],
  [
    { x: 96, y: 250 },
    { x: 96, y: 360 },
    { x: 294, y: 350 },
    { x: 294, y: 450 },
  ],
  [
    { x: 294, y: 450 },
    { x: 294, y: 530 },
    { x: 200, y: 540 },
    { x: 196, y: 600 },
  ],
]

function bezier([p0, p1, p2, p3]: Segment, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

// 길이 기준으로 길 위의 점을 찾는다 (브라우저의 getPointAtLength 대신. 테스트 환경에서도 같게 동작)
function buildPath(segments: Segment[], samplesPerSegment = 240) {
  const points: Point[] = [segments[0][0]]
  const lengths = [0]
  for (const segment of segments) {
    for (let i = 1; i <= samplesPerSegment; i++) {
      const point = bezier(segment, i / samplesPerSegment)
      const prev = points[points.length - 1]
      lengths.push(lengths[lengths.length - 1] + Math.hypot(point.x - prev.x, point.y - prev.y))
      points.push(point)
    }
  }
  const length = lengths[lengths.length - 1]
  const pointAt = (distance: number): Point => {
    const d = Math.min(length, Math.max(0, distance))
    let lo = 0
    let hi = lengths.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (lengths[mid] < d) lo = mid
      else hi = mid
    }
    const span = lengths[hi] - lengths[lo] || 1
    const u = (d - lengths[lo]) / span
    return { x: points[lo].x + (points[hi].x - points[lo].x) * u, y: points[lo].y + (points[hi].y - points[lo].y) * u }
  }
  return { length, pointAt }
}

export const roadPath = buildPath(SEGMENTS)
// 차는 화면 바로 위(곧은 길 위쪽 끝에서 320px 내려온 곳)에서 출발한다
const CAR_START = 320

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const smoothstep = (a: number, b: number, v: number) => {
  const u = clamp((v - a) / (b - a), 0, 1)
  return u * u * (3 - 2 * u)
}
const easeInOutSine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u)
const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)
const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3)
const easeInCubic = (u: number) => u * u * u

// 길 끝에서 오른쪽 아래 화면 밖으로 빠져나가는 길
function exitPoint(u: number): Point {
  const p0 = { x: 196, y: 618 }
  const c = { x: 320, y: 700 }
  const p1 = { x: 560, y: 1010 }
  const v = 1 - u
  return { x: v * v * p0.x + 2 * v * u * c.x + u * u * p1.x, y: v * v * p0.y + 2 * v * u * c.y + u * u * p1.y }
}
const EXIT_LENGTH = 480

interface CarTrack {
  x: number
  y: number
  dx: number
  dy: number
  scale: number
  speed: number
  distance: number
}

function carTrack(t: number, transitionAt: number | null): CarTrack {
  if (transitionAt !== null && t >= transitionAt) {
    const u = easeInCubic(clamp((t - transitionAt) / TRANSITION, 0, 1))
    const a = exitPoint(u)
    const b = exitPoint(Math.min(1, u + 0.04))
    return { x: a.x, y: a.y, dx: b.x - a.x + 0.001, dy: b.y - a.y, scale: 1 + 0.15 * u, speed: 1, distance: roadPath.length + EXIT_LENGTH * u }
  }
  const u = clamp((t - TIMING.driveStart) / (TIMING.driveEnd - TIMING.driveStart), 0, 1)
  const p = easeInOutSine(u)
  const d = CAR_START + p * (roadPath.length - CAR_START)
  const here = roadPath.pointAt(d)
  // 조금 앞을 보고 방향을 정해 커브에 미리 반응한다
  let ahead = roadPath.pointAt(d + 34)
  let from = here
  if (d > roadPath.length - 34) {
    from = roadPath.pointAt(roadPath.length - 34)
    ahead = here
  }
  return { x: here.x, y: here.y + 18, dx: ahead.x - from.x, dy: ahead.y - from.y, scale: 0.5 + 0.5 * p, speed: Math.sin(Math.PI * u), distance: d }
}

const headingAt = (t: number, transitionAt: number | null) => {
  const c = carTrack(t, transitionAt)
  return (Math.atan2(c.dy, c.dx) * 180) / Math.PI
}

// '붕': 중력으로 떨어져 두세 번 튀고, 닿을 때마다 납작해졌다 펴진다
function dropLetter(t: number, startAt: number) {
  const height = 110
  const fall = 0.24
  const g = (2 * height) / (fall * fall)
  const restitution = 0.36
  let tau = t - startAt
  if (tau < 0) return { y: -height, sx: 1, sy: 1, opacity: 0 }
  const opacity = clamp(tau / 0.08, 0, 1)
  if (tau < fall) return { y: -height + 0.5 * g * tau * tau, sx: 0.94, sy: 1.08, opacity }
  tau -= fall
  let v = g * fall * restitution
  let impact = 0.2
  let sinceImpact = tau
  let y = 0
  for (let bounce = 0; bounce < 3; bounce++) {
    const flight = (2 * v) / g
    if (tau < flight) {
      y = -(v * tau - 0.5 * g * tau * tau)
      sinceImpact = tau
      break
    }
    tau -= flight
    v *= restitution
    impact *= 0.45
    sinceImpact = tau
  }
  const squash = impact * Math.exp(-16 * sinceImpact) * Math.cos(28 * sinceImpact)
  return { y, sx: 1 + squash * 0.9, sy: 1 - squash, opacity }
}

// '어' '스': 오른쪽 밖에서 빠르게 달려와 스프링처럼 살짝 지나쳤다가 선다. 속도만큼 앞으로 기운다
function driveInLetter(t: number, startAt: number) {
  const distance = 330
  const k = 8
  const w = 6.5
  const tau = t - startAt
  if (tau < 0) return { x: distance, skew: 16 }
  const decay = Math.exp(-k * tau)
  const x = distance * decay * Math.cos(w * tau)
  const v = distance * decay * (-k * Math.cos(w * tau) - w * Math.sin(w * tau))
  return { x, skew: clamp(-v * 0.012, -16, 16) }
}

export interface LetterPose {
  x: number
  y: number
  sx: number
  sy: number
  skew: number
  opacity: number
}

export interface PuffPose {
  x: number
  y: number
  scale: number
  opacity: number
}

export interface SplashFrame {
  background: number
  road: { reveal: number; opacity: number }
  car: {
    x: number
    y: number
    scale: number
    roll: number
    facingLeft: number
    width: number
    squash: number
    opacity: number
    wheelAngle: number
  }
  shadow: { x: number; y: number; sx: number; sy: number; opacity: number }
  puffs: PuffPose[]
  letters: LetterPose[]
  word: { x: number; y: number; scale: number; opacity: number }
}

export const PUFF_COUNT = 46

// 로그인 화면 로고 자리 (390 x 844 기준 좌표). 없으면 홈으로 가는 경우
export interface WordTarget {
  x: number
  y: number
  width: number
}

export function splashFrame(t: number, transitionAt: number | null = null, target: WordTarget | null = null): SplashFrame {
  const tr = transitionAt === null ? 0 : easeInOutCubic(clamp((t - transitionAt - 0.05) / (TRANSITION - 0.1), 0, 1))
  const exited = transitionAt !== null && t >= transitionAt + TRANSITION

  // 차
  const c = carTrack(t, transitionAt)
  const len = Math.hypot(c.dx, c.dy) || 1
  const ux = c.dx / len
  let facingLeft = smoothstep(0.18, -0.18, ux) // 그림은 왼쪽 아래를 본다
  let width = 0.58 + 0.42 * clamp(Math.abs(ux) / 0.55, 0, 1) // 돌아설 때 좁아졌다 넓어진다
  if (c.distance < 474) {
    // 화면 위에서 곧게 내려오는 동안은 그림 방향 그대로
    facingLeft = 1
    width = Math.max(width, 0.8)
  }
  if (transitionAt !== null && t >= transitionAt) {
    facingLeft = 1 - smoothstep(transitionAt, transitionAt + 0.22, t)
    width = 0.58 + 0.42 * Math.abs(2 * facingLeft - 1)
  }
  const crossesExit = transitionAt !== null && t - 0.02 < transitionAt && t + 0.02 > transitionAt
  const turn = crossesExit ? 0 : ((headingAt(t + 0.02, transitionAt) - headingAt(t - 0.02, transitionAt) + 540) % 360) - 180
  let roll = clamp(turn * 0.9, -14, 14)
  const bob = Math.sin(t * 2 * Math.PI * 9) * 1.8 * (0.25 + c.speed) + Math.sin(t * 2 * Math.PI * 3.3) * 0.8
  let squash = 1 + Math.sin(t * 2 * Math.PI * 9 + 1.2) * 0.02 * (0.3 + c.speed)
  const sinceStop = t - TIMING.driveEnd
  if (sinceStop > 0 && (transitionAt === null || t < transitionAt)) {
    // 끼익: 앞으로 쏠렸다가 스프링처럼 흔들리며 선다
    const wobble = Math.exp(-5.5 * sinceStop) * Math.sin(13 * sinceStop)
    roll += -7 * wobble * (facingLeft > 0.5 ? 1 : -1)
    squash *= 1 - 0.05 * wobble
  }
  const carOpacity = exited ? 0 : clamp((t - TIMING.driveStart) / 0.12, 0, 1)

  // 배기 연기: 달리는 동안 70ms마다 차 뒤에서 나온다
  const puffs: PuffPose[] = []
  const end = transitionAt === null ? t : Math.min(t, transitionAt + TRANSITION)
  for (let emitted = TIMING.driveStart + 0.05; emitted < end && puffs.length < PUFF_COUNT - 2; emitted += 0.07) {
    const age = t - emitted
    if (age > 0.55) continue
    const at = carTrack(emitted, transitionAt)
    if (at.speed < 0.08) continue
    const l = Math.hypot(at.dx, at.dy) || 1
    const rx = -at.dx / l
    const ry = -at.dy / l
    const a = age / 0.55
    puffs.push({
      x: at.x + rx * 60 * at.scale + rx * 16 * a,
      y: at.y - 22 * at.scale + ry * 30 * at.scale - 18 * a,
      scale: (0.35 + 1.1 * a) * at.scale,
      opacity: (1 - a) * 0.75,
    })
  }
  // '어스'가 멈출 때 바닥 먼지
  const dust = t - (TIMING.eo + 0.28)
  for (let k = 0; k < 2; k++) {
    const a = dust / 0.5
    const on = dust > 0 && dust < 0.5
    puffs.push({
      x: WORD_BOX.x + WORD_BOX.width + 4 + k * 18 + a * 14,
      y: 748 - k * 10 - a * 12,
      scale: 0.6 + k * 0.2 + a * 0.8,
      opacity: on ? (1 - a) * 0.8 : 0,
    })
  }
  while (puffs.length < PUFF_COUNT) puffs.push({ x: 0, y: 0, scale: 1, opacity: 0 })

  // 글자
  const b1 = dropLetter(t, TIMING.bung1)
  const b2 = dropLetter(t, TIMING.bung2)
  const eo = driveInLetter(t, TIMING.eo)
  const seu = driveInLetter(t, TIMING.seu)
  const letters: LetterPose[] = [
    { x: 0, y: b1.y, sx: b1.sx, sy: b1.sy, skew: 0, opacity: b1.opacity },
    { x: 0, y: b2.y, sx: b2.sx, sy: b2.sy, skew: 0, opacity: b2.opacity },
    { x: eo.x, y: 0, sx: 1, sy: 1, skew: eo.skew, opacity: 1 },
    { x: seu.x, y: 0, sx: 1, sy: 1, skew: seu.skew, opacity: 1 },
  ]

  // 글자 묶음: 로그인 로고 자리로 이어지거나(로그인), 그 자리에서 사라진다(홈)
  const word = target
    ? {
        x: (target.x - WORD_BOX.x) * tr,
        y: (target.y - WORD_BOX.y) * tr,
        scale: lerp(1, target.width / WORD_BOX.width, tr),
        opacity: 1,
      }
    : { x: 0, y: 0, scale: lerp(1, 1.08, tr), opacity: 1 - tr }

  return {
    background: 1 - tr,
    road: { reveal: easeOutCubic(clamp(t / TIMING.roadEnd, 0, 1)), opacity: 1 - tr },
    car: { x: c.x, y: c.y + bob, scale: c.scale, roll, facingLeft, width, squash, opacity: carOpacity, wheelAngle: -((c.distance / 13.5) * 180) / Math.PI },
    shadow: { x: c.x, y: c.y - 3, sx: c.scale * width * 1.1, sy: c.scale, opacity: carOpacity * 0.9 },
    puffs,
    letters,
    word,
  }
}

// 카카오 로그인에서 돌아오는 주소에서는 스플래시를 다시 보여 주지 않는다
export function shouldShowSplash(pathname: string) {
  return !pathname.startsWith('/oauth/callback')
}
