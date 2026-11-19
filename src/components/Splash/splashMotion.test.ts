import { describe, expect, it } from 'vitest'
import { HOLD, roadPath, shouldShowSplash, splashFrame, TIMING, TRANSITION } from './splashMotion'

describe('S자 길', () => {
  it('화면 위 밖에서 시작해 붕붕이가 멈추는 자리에서 끝난다', () => {
    expect(roadPath.pointAt(0)).toEqual({ x: 300, y: -400 })
    const end = roadPath.pointAt(roadPath.length)
    expect(end.x).toBeCloseTo(196, 0)
    expect(end.y).toBeCloseTo(600, 0)
  })
})

describe('붕붕이 드라이브', () => {
  it('출발 전에는 보이지 않고, 화면 위에서 내려오기 시작한다', () => {
    expect(splashFrame(0.1).car.opacity).toBe(0)
    const start = splashFrame(TIMING.driveStart + 0.15).car
    expect(start.opacity).toBeGreaterThan(0)
    expect(start.y).toBeLessThan(120)
  })

  it('주행이 끝나면 길 끝에 원래 크기로 멈춘다', () => {
    const car = splashFrame(TIMING.driveEnd).car
    expect(car.x).toBeCloseTo(196, 0)
    // 엔진 진동으로 위아래 몇 px 흔들린다
    expect(Math.abs(car.y - 618)).toBeLessThan(4)
    expect(car.scale).toBeCloseTo(1, 2)
  })

  it('왼쪽으로 갈 땐 그림 그대로, 오른쪽으로 갈 땐 돌아서 반대쪽을 본다', () => {
    const frames = Array.from({ length: 120 }, (_, i) => splashFrame(TIMING.driveStart + 0.2 + (i / 120) * 1.2).car)
    expect(frames.some((car) => car.facingLeft > 0.9)).toBe(true)
    expect(frames.some((car) => car.facingLeft < 0.1)).toBe(true)
  })

  it('달리는 동안 바퀴가 굴러가고 멈추면 바퀴도 멈춘다', () => {
    expect(splashFrame(1.0).car.wheelAngle).not.toBe(splashFrame(1.1).car.wheelAngle)
    expect(splashFrame(2.0).car.wheelAngle).toBe(splashFrame(2.4).car.wheelAngle)
  })

  it('달리는 동안 뒤로 배기 연기가 난다', () => {
    expect(splashFrame(1.0).puffs.some((puff) => puff.opacity > 0)).toBe(true)
    expect(splashFrame(0.1).puffs.every((puff) => puff.opacity === 0)).toBe(true)
  })
})

describe('붕붕어스 글자', () => {
  it('‘붕’은 위에서 떨어져 튀다가 제자리에 선다', () => {
    const before = splashFrame(TIMING.bung1 - 0.05).letters[0]
    expect(before.opacity).toBe(0)
    const falling = splashFrame(TIMING.bung1 + 0.1).letters[0]
    expect(falling.y).toBeLessThan(0)
    const settled = splashFrame(HOLD).letters[0]
    expect(settled.y).toBeCloseTo(0, 1)
    expect(settled.sx).toBeCloseTo(1, 2)
    expect(settled.sy).toBeCloseTo(1, 2)
  })

  it('‘어’는 오른쪽 밖에서 달려와 살짝 지나쳤다가 제자리에 선다', () => {
    expect(splashFrame(TIMING.eo - 0.01).letters[2].x).toBeGreaterThan(300)
    const path = Array.from({ length: 80 }, (_, i) => splashFrame(TIMING.eo + i * 0.01).letters[2].x)
    const overshoot = Math.min(...path)
    expect(overshoot).toBeLessThan(0)
    expect(overshoot).toBeGreaterThan(-16)
    expect(splashFrame(HOLD).letters[2].x).toBeCloseTo(0, 0)
  })

  it('달려오는 동안은 앞으로 기울고 서면 똑바로 선다', () => {
    expect(splashFrame(TIMING.eo + 0.02).letters[2].skew).toBeGreaterThan(8)
    expect(splashFrame(HOLD).letters[2].skew).toBeCloseTo(0, 0)
  })
})

describe('로그인 화면으로 전환', () => {
  const target = { x: 131, y: 183.5, width: 128 }

  it('전환 전에는 스플래시 배경이 화면을 덮고 있다', () => {
    const frame = splashFrame(HOLD + 1, null, target)
    expect(frame.background).toBe(1)
    expect(frame.word.x).toBe(0)
  })

  it('전환이 끝나면 배경이 사라지고 차는 화면 밖으로, 글자는 로그인 로고 자리로 간다', () => {
    const frame = splashFrame(HOLD + TRANSITION, HOLD, target)
    expect(frame.background).toBe(0)
    expect(frame.car.x > 390 || frame.car.y > 844).toBe(true)
    expect(frame.word.x).toBeCloseTo(131 - 76, 1)
    expect(frame.word.y).toBeCloseTo(183.5 - 700, 1)
    expect(frame.word.scale).toBeCloseTo(128 / 238, 2)
    expect(frame.word.opacity).toBe(1)
  })

  it('로고 자리가 없으면(홈으로 가면) 글자는 그 자리에서 사라진다', () => {
    const frame = splashFrame(HOLD + TRANSITION, HOLD, null)
    expect(frame.word.x).toBe(0)
    expect(frame.word.opacity).toBe(0)
  })
})

describe('스플래시를 보여 줄지', () => {
  it('앱을 새로 열면 보여 준다', () => {
    expect(shouldShowSplash('/')).toBe(true)
    expect(shouldShowSplash('/login')).toBe(true)
  })

  it('카카오 로그인에서 돌아올 때는 보여 주지 않는다', () => {
    expect(shouldShowSplash('/oauth/callback')).toBe(false)
  })
})
