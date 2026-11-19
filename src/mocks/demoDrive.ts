import type { Drive } from '@/types/drive'
import type { Coordinate, Route } from '@/types/route'
import type { Position } from '@/utils/location'
import { decodePolyline } from '@/utils/polyline'
import { findActiveMockDrive, findMockDrive } from './drives'
import { findMockRestAreaCoordinate, hasMockStamp } from './restAreas'
import { findMockRoute } from './routes'
import { ANMOK_BEACH, MOCK_CURRENT_COORDINATE } from './search'
import { distanceBetween } from './utils'

// 시연용: 목적지를 강릉 안목해변으로 정하면 실제 도로 모양 경로가 잡히고, 출발하면 붕붕이가 경로를 따라 빠르게 달린다.
// 강릉대관령휴게소에 닿으면 도장을 찍을 때까지(최대 3분) 멈춘다

// OSRM(OpenStreetMap)으로 받은 양재 → 횡성휴게소 → 안목해변 도로 경로 (점 수를 줄인 Google polyline)
export const DEMO_POLYLINE = 'aaxcFk_jfWLr@bBOJfCeDb@}JuqAsLm]VwApj@}V|zBoyBfGyE|YqNxJsD`Hs@rFFfG~@vW~Gl]~AhM}@`RcJfM{KdDgExF{Jlf@{wAdIiR|DaHGqo@t@aQDeXxBiiAy@qLe@aCaUew@eA}G[oFBeEvByY|CqMfEcIbD}D~c@eb@bIqL~H}PhFwPfD_ShBqRrCmLhGySv]{_AlC}JrB{N|@kPm@q{@`@yVfBaNdDcMnDkIfL{SlBwErBoIz@qHdBqX`C_SnNqv@nCuTt@oNzBsw@nB_YtD_Y`CmMhk@ghCnAyIfD{]zAqI~CwLtEcMtP{ZzI}SxE_RfEa[jAs]rAkRCiCa@mBmAgBcIyDcCqCkA_E_@eG_@g[tAgjCOmMmEo}@}Cc\\oXmkBoC}ZByPdCyp@hBaXtBeq@l@e^wBymCQyv@|OivDjA}a@]_zAiBs[iDwZm@oUDuJr@eNxE_d@ZuLIqHkEae@cUqnBkTapAgA}Lm@sSPsVzAgT~G{r@d@}RWmOaEscAmBac@aAyKiAyImGwZ{g@}nAci@oiB}AoHgA}IoAw\\R{QxCkh@~GguCcAaTuH{a@oA_Kq@qMAmJjAqPz\\g{Bz@aKVgLScJw@aL_AoGsKcf@iBeP_@}On@u_BY_\\}AkQiPe~@cAeNE}PbA_QxEsb@fIgm@tZqwAvXufA`CeMzA_Nz@wQJqJGgJ_AiRsDcYgM}r@mC}QyA_UOwV`@yMtA_QbDkSrD{N|a@soAjC}K|@qGt@qMMqPcBiPsEgVqAwJiA}PYgNJgLr@}M~I_t@z@mMJ{L{AwEaCeB}PcDmq@iTcHmFaGoJiDuLcAaMFeHj@cJbBsNfAqClBsA|Pe@PmHai@gMcPsJu\\sX}PuIgNsB}]_DoViHeG_E_JgKeC_FaG{SaCgFsGiIeHyEgT_KkIoB{Oi@wSzB_Ob@_GWaSoD}D@oi@~CcDzAcCvBeG~KmBnBuGhB_EQwHkCaJsH_H}DmWwGiMmIyQcAiC_Ds@qBsBqJyJcZuHu^wR}hA[sDG}JnHq`BK}Ns@mJyG}_@NsFpDyMaByKl@iElA}@vEA`EqArOmKz]kN~OeLdGsH~Q{c@hFgFfRaMtB{B`MkVdTs[tDuBhMuCtIiEdFqElJoLlARzKzP`SvQz@nCi@zC_AZy@Si@_AGsB`Dmd@pAwJjSsz@vDgL`Ns\\hAcEfAkLUeKq@cFeAsDgD{GwDcE}EsCcFsAsFUgQ|BqECaG_AoFwCaf@m^aKoE{IoA}LTuGtAePrHyHr@aEa@oDkAkEmDyCgFqCsJs@mGE{Kh@kGnDeOdHcUlCoGxEgGtJ_JbD}EhB_FbImm@ZwHEmKc@eIy@aFyGoVaDcJuEaKmEcHaNyNo\\_Ui[sc@sBeEiB{FqAcHcCgVmAcG}B}GkF{IsQuRgFoHqCwHwBgPQ_r@oD_`@c@aT}@gM}@aHaCeLwHoUsBiKw@kMJuYWeGw@qGsRwv@{GgQuByE{DoFqQwNmDyDiK{S_EiGaG}EeOyI}HsHiW}b@yCuGeDeKsL}k@_AyKe@{d@c@_Iy@cGoAyFcPwe@_GuKw`Dw|EmImNaDuHsCyKoAiIsHuv@wCmUyQun@aBoKo@}HK{TbBij@fA{RtEkk@TgIa@wNcAyH{A}GyCwHwF{IqpAw~A_JoOoJyRcZaf@{IkImS_KgF}DuAkBsEyH_HmSmEyHqFgF}GqDm]gG{F_C{GkFiEeGqOsZyAiH]yGf@}JhDeQxAqNfFqjAPkJ[aJmAaJmBmH_GgLcJqIuKqEcPiCaJiCm\\mTwGwGaEiGaSq_@oDuIkBkJ}@cPy@mHuBoJoCeH{D{G_FgGyi@ug@cEuG_EiL_A{Ew@gJib@{sGeByRwAiIaBoHgDoK}LqZcLk^cDcOeOg{@{C{MmE{KgNgUuFgLiX}eAoEiUoEee@iH{e@_AyNiDyz@yAgOaPej@oJup@cCoMuGcQ{Zog@sEcJcDyKqAoIe@mG?sQd@mGhBiKpBcHdCuFlSaYpC}FlEoOtAaLRqEA{OsEulBv@iXrDeXtDwN~FcOlu@wuAnFwLbHyU~DoVbBgXJsV_@cK}Dub@a@kJH}IjAuVC_Hs@oI{BqJoDiIuC{DyDsDsH}D}JcBae@Pms@jAiPpAmQdEu_@tSoKdBcJOkGgAuEkBqFuDkO}OeFsCqF_BuGm@iHRmR`FcGx@{HA{GuAkImEo`@_^uD_CiGyBwGy@oGDcSzDsG^qFWaH_BmIyE{EgFiMcWaKyMsKiHaY{KkPoNqDmF{DkIwEsOoEyWyC_IwE_IwJ}Jgh@a\\mDmDaEkGyDiKsAwG{@yLE{Jr@{]h@{Gl@uCtC_IrCkEtE}D`HkC|UoFri@gItKg@fMHhEjBjDrDdD_@z@qBTuB`Cyc@|AuFp|@mp@rCcE^uEQ_BoA}AsBS{Ff@gE]mPeHaFiEuCiHsAoOz@}VyGe{@L{Ak@_AcBmNUiNuAiSIyGiEeRkTcOuNwWsEgKm@SqY}_@_`@ac@uYiy@wQqb@eGwUyBcGE_AdAwIjCmKr@sFA{E`BuVi@{TvFuMcEpA_@]fBiFbBoB'
export const DEMO_ROUTE_DISTANCE_METERS = 219_554
export const DEMO_ROUTE_DURATION_SECONDS = 11_454
export const DEMO_STOP_REST_AREA_ID = 'rest_mock_11'

const DESTINATION_RADIUS = 2000
const ON_ROUTE_METERS = 500
const TICK_MS = 300
const MAX_SPEED = 3000
const MIN_SPEED = 30
const SLOWDOWN = 0.25
const STOP_WAIT_MS = 3 * 60 * 1000
const DISPLAY_SPEED = 27

const POINTS = decodePolyline(DEMO_POLYLINE)
const ALONG = POINTS.reduce<number[]>(
  (sum, point, index) => [...sum, index === 0 ? 0 : sum[index - 1] + distanceBetween(POINTS[index - 1], point)],
  [],
)
const TOTAL = ALONG.at(-1) ?? 0

export const isDemoDestination = (coordinate: Coordinate) => distanceBetween(coordinate, ANMOK_BEACH) <= DESTINATION_RADIUS

const isDemoDrive = (drive: Drive | null): drive is Drive =>
  !!drive?.routeId && findMockRoute(drive.routeId)?.polyline === DEMO_POLYLINE

export const isDemoRoute = (route: Route | null) => route?.polyline === DEMO_POLYLINE

function pointAt(meters: number): Coordinate {
  if (meters <= 0) return POINTS[0]
  if (meters >= TOTAL) return POINTS[POINTS.length - 1]
  let low = 0
  let high = ALONG.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (ALONG[mid] <= meters) low = mid
    else high = mid
  }
  const ratio = (meters - ALONG[low]) / (ALONG[high] - ALONG[low] || 1)
  const from = POINTS[low]
  const to = POINTS[high]
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * ratio,
    longitude: from.longitude + (to.longitude - from.longitude) * ratio,
  }
}

// 경로 위(500m 안)에 있으면 출발지부터 그 지점까지의 경로 거리, 아니면 null
export function alongDemoRoute(coordinate: Coordinate): number | null {
  let offset = Infinity
  let along = 0
  POINTS.forEach((point, index) => {
    const meters = distanceBetween(point, coordinate)
    if (meters < offset) {
      offset = meters
      along = ALONG[index]
    }
  })
  return offset <= ON_ROUTE_METERS ? along : null
}

interface Progress {
  driveId: string
  traveled: number
  stoppedAt: number | null
  released: boolean
}

let progress: Progress | null = null
let stopAlong: number | null = null

export function resetDemoDrive() {
  progress = null
}

export function demoTraveledMeters(driveId: string) {
  return progress?.driveId === driveId ? progress.traveled : 0
}

function advance(seconds: number) {
  const drive = findActiveMockDrive()
  if (!isDemoDrive(drive)) return false
  if (progress?.driveId !== drive.id) progress = { driveId: drive.id, traveled: 0, stoppedAt: null, released: false }
  if (drive.status !== 'ACTIVE') return false

  stopAlong ??= alongDemoRoute(findMockRestAreaCoordinate(DEMO_STOP_REST_AREA_ID)) ?? TOTAL
  if (!progress.released && progress.traveled >= stopAlong) {
    progress.stoppedAt ??= Date.now()
    if (!hasMockStamp(DEMO_STOP_REST_AREA_ID) && Date.now() - progress.stoppedAt < STOP_WAIT_MS) return true
    progress.released = true
  }

  const target = progress.released ? TOTAL : stopAlong
  const speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, (target - progress.traveled) * SLOWDOWN))
  progress.traveled = Math.min(target, progress.traveled + speed * seconds)
  return true
}

export function mockCurrentCoordinate(): Coordinate {
  const drive = progress && findMockDrive(progress.driveId)
  const other = findActiveMockDrive()
  if (!progress || !isDemoDrive(drive) || drive.status === 'CANCELLED' || (other && other.id !== drive.id)) {
    return MOCK_CURRENT_COORDINATE
  }
  return pointAt(progress.traveled)
}

export function mockCurrentPosition(): Position {
  const moving = !!progress && findMockDrive(progress.driveId)?.status === 'ACTIVE'
  return {
    coordinate: mockCurrentCoordinate(),
    accuracyMeters: 10,
    recordedAt: new Date().toISOString(),
    speedMetersPerSecond: moving ? DISPLAY_SPEED : null,
  }
}

const listeners = new Set<(position: Position) => void>()
let timer: ReturnType<typeof setInterval> | null = null

export function mockWatchPosition(onChange: (position: Position) => void): () => void {
  listeners.add(onChange)
  onChange(mockCurrentPosition())
  if (!timer) {
    let last = Date.now()
    timer = setInterval(() => {
      const now = Date.now()
      const moved = advance((now - last) / 1000)
      last = now
      if (!moved) return
      const position = mockCurrentPosition()
      listeners.forEach((listener) => listener(position))
    }, TICK_MS)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}
