import { useEffect, useRef } from 'react'
import carBody from '@/assets/images/splash/car-body.webp'
import hub from '@/assets/images/splash/hub.webp'
import letterBung from '@/assets/images/splash/letter-bung.webp'
import letterEo from '@/assets/images/splash/letter-eo.webp'
import letterSeu from '@/assets/images/splash/letter-seu.webp'
import styles from './Splash.module.scss'
import {
  HOLD,
  PUFF_COUNT,
  ROAD_D,
  roadPath,
  splashFrame,
  TIME_SCALE,
  TRANSITION,
  type SplashFrame,
  type WordTarget,
} from './splashMotion'

const STAGE_WIDTH = 390
const STAGE_HEIGHT = 844
// 동작 줄이기 설정이면 완성된 로고를 이만큼 보여 주고 끝낸다
const REDUCED_HOLD_MS = 600

// 글자 4개의 자리 (로고 글자 이미지 384 x 94를 0.62배로 놓은 위치)
const LETTERS = [
  { src: letterBung, left: 0, width: 57.66 },
  { src: letterBung, left: 60.14, width: 57.66 },
  { src: letterEo, left: 121.52, width: 54.56 },
  { src: letterSeu, left: 180.42, width: 57.66 },
]

interface SplashProps {
  // 서버 확인이 끝나 앱 화면을 그릴 수 있는지. 준비될 때까지 완성된 로고로 기다린다
  ready: boolean
  onDone: () => void
}

// 앱을 열 때의 스플래시. 붕붕이가 S자 길을 운전해 내려오고 ‘붕붕’이 튀고 ‘어스’가 달려와 선 뒤,
// 글자가 로그인 화면 로고 자리([data-splash-logo])로 이어지며 사라진다. 화면을 탭하면 건너뛴다
function Splash({ ready, onDone }: SplashProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const roadRef = useRef<SVGSVGElement>(null)
  const revealRef = useRef<SVGPathElement>(null)
  const carRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<(HTMLImageElement | null)[]>([])
  const puffRefs = useRef<(HTMLDivElement | null)[]>([])

  const readyRef = useRef(ready)
  const onDoneRef = useRef(onDone)
  const skipRef = useRef(false)
  useEffect(() => {
    readyRef.current = ready
    onDoneRef.current = onDone
  }, [ready, onDone])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

    // 390 x 844 무대를 화면에 맞게 줄이고 가운데에 놓는다
    let fit = { k: 1, left: 0, top: 0 }
    const layout = () => {
      const width = root.clientWidth || STAGE_WIDTH
      const height = root.clientHeight || STAGE_HEIGHT
      const k = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT)
      fit = { k, left: (width - STAGE_WIDTH * k) / 2, top: (height - STAGE_HEIGHT * k) / 2 }
      stage.style.transform = `translate(${fit.left}px, ${fit.top}px) scale(${k})`
    }
    layout()
    window.addEventListener('resize', layout)

    let hiddenLogo: HTMLElement | null = null
    const restoreLogo = () => {
      if (hiddenLogo) hiddenLogo.style.visibility = ''
      hiddenLogo = null
    }
    // 로그인 화면의 로고 자리를 무대 좌표로 바꾼다. 글자가 날아가는 동안 진짜 로고는 숨긴다
    const findTarget = (): WordTarget | null => {
      const logo = document.querySelector<HTMLElement>('[data-splash-logo]')
      if (!logo) return null
      const rect = logo.getBoundingClientRect()
      const base = root.getBoundingClientRect()
      hiddenLogo = logo
      logo.style.visibility = 'hidden'
      return { x: (rect.left - base.left - fit.left) / fit.k, y: (rect.top - base.top - fit.top) / fit.k, width: rect.width / fit.k }
    }

    const apply = (f: SplashFrame) => {
      if (bgRef.current) bgRef.current.style.opacity = String(f.background)
      if (roadRef.current) roadRef.current.style.opacity = String(f.road.opacity)
      if (revealRef.current) revealRef.current.style.strokeDashoffset = String(roadPath.length * (1 - f.road.reveal))
      const { car, shadow } = f
      if (carRef.current) {
        carRef.current.style.opacity = String(car.opacity)
        carRef.current.style.transform = `translate(${car.x - 80}px, ${car.y - 162}px) scale(${car.scale}) rotate(${car.roll}deg)`
      }
      if (bodyRef.current) bodyRef.current.style.transform = `scale(${car.width}, ${car.squash})`
      if (leftRef.current) leftRef.current.style.opacity = String(car.facingLeft)
      if (rightRef.current) rightRef.current.style.opacity = String(1 - car.facingLeft)
      root.querySelectorAll<HTMLElement>('[data-hub]').forEach((el) => {
        el.style.transform = `rotate(${car.wheelAngle}deg)`
      })
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(shadow.opacity)
        shadowRef.current.style.transform = `translate(${shadow.x - 60}px, ${shadow.y - 11}px) scale(${shadow.sx}, ${shadow.sy})`
      }
      f.puffs.forEach((puff, i) => {
        const el = puffRefs.current[i]
        if (!el) return
        el.style.opacity = String(puff.opacity)
        el.style.transform = `translate(${puff.x - 10}px, ${puff.y - 10}px) scale(${puff.scale})`
      })
      f.letters.forEach((letter, i) => {
        const el = letterRefs.current[i]
        if (!el) return
        el.style.opacity = String(letter.opacity)
        el.style.transform = `translate(${letter.x}px, ${letter.y}px) skewX(${letter.skew}deg) scale(${letter.sx}, ${letter.sy})`
      })
      if (wordRef.current) {
        wordRef.current.style.opacity = String(f.word.opacity)
        wordRef.current.style.transform = `translate(${f.word.x}px, ${f.word.y}px) scale(${f.word.scale})`
      }
    }

    let raf = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      restoreLogo()
      onDoneRef.current()
    }

    if (reduce) {
      apply(splashFrame(HOLD))
      let readyAt: number | null = null
      const wait = (now: number) => {
        if (readyRef.current && readyAt === null) readyAt = now
        if (readyAt !== null && now - readyAt >= REDUCED_HOLD_MS) return finish()
        raf = requestAnimationFrame(wait)
      }
      raf = requestAnimationFrame(wait)
    } else {
      let start: number | null = null
      let offset = 0 // 건너뛰기로 앞당긴 시간 (기본 타임라인 초)
      let transitionAt: number | null = null
      let target: WordTarget | null = null
      const tick = (now: number) => {
        if (start === null) start = now
        const elapsed = (now - start) / 1000 / TIME_SCALE
        if (skipRef.current) {
          skipRef.current = false
          if (elapsed + offset < HOLD) offset = HOLD - elapsed
        }
        const t = elapsed + offset
        if (transitionAt === null && readyRef.current && t >= HOLD) {
          transitionAt = t
          target = findTarget()
        }
        apply(splashFrame(t, transitionAt, target))
        if (transitionAt !== null && t >= transitionAt + TRANSITION) return finish()
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
      restoreLogo()
    }
  }, [])

  const side = (mirrored: boolean) => (
    <div ref={mirrored ? rightRef : leftRef} className={`${styles.side} ${mirrored ? styles.mirrored : ''}`}>
      <div className={`${styles.hub} ${styles.rear}`}>
        <img data-hub src={hub} alt="" />
      </div>
      <div className={`${styles.hub} ${styles.front}`}>
        <img data-hub src={hub} alt="" />
      </div>
      <img className={styles.bodyImage} src={carBody} alt="" />
    </div>
  )

  return (
    <div ref={rootRef} className={styles.root} role="img" aria-label="붕붕어스" onClick={() => (skipRef.current = true)}>
      <div ref={bgRef} className={styles.bg} />
      <div ref={stageRef} className={styles.stage} aria-hidden="true">
        <svg ref={roadRef} className={styles.road} viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} fill="none">
          <defs>
            <mask id="splash-road-reveal" maskUnits="userSpaceOnUse">
              <path
                ref={revealRef}
                d={ROAD_D}
                stroke="#fff"
                strokeWidth="80"
                strokeLinecap="round"
                strokeDasharray={`${roadPath.length} ${roadPath.length}`}
                strokeDashoffset={roadPath.length}
              />
            </mask>
            <filter id="splash-road-soften" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <g mask="url(#splash-road-reveal)">
            <path d={ROAD_D} stroke="#FDD6D2" strokeWidth="66" strokeLinecap="round" />
            <path d={ROAD_D} stroke="#FFEAE6" strokeWidth="56" strokeLinecap="round" />
            <path d={ROAD_D} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 14" />
          </g>
          {/* 붕붕이가 멈추는 길 끝의 둥근 끝을 배경색 블러로 덮는다 */}
          <ellipse cx="196" cy="612" rx="62" ry="44" fill="#FFFBFB" filter="url(#splash-road-soften)" />
        </svg>
        <div ref={wordRef} className={styles.word}>
          {LETTERS.map((letter, i) => (
            <img
              key={i}
              ref={(el) => {
                letterRefs.current[i] = el
              }}
              className={styles.letter}
              src={letter.src}
              alt=""
              style={{ left: letter.left, width: letter.width }}
            />
          ))}
        </div>
        {Array.from({ length: PUFF_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              puffRefs.current[i] = el
            }}
            className={styles.puff}
          />
        ))}
        <div ref={shadowRef} className={styles.shadow} />
        <div ref={carRef} className={styles.car}>
          <div ref={bodyRef} className={styles.body}>
            {side(false)}
            {side(true)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Splash
