import { useEffect, useMemo, useRef, useState } from 'react'
import { CustomOverlayMap, Map, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import currentLocationIcon from '@/assets/icons/current-location.svg'
import mapLabelIcon from '@/assets/icons/map-label.svg'
import mapPinIcon from '@/assets/icons/map-pin.svg'
import originDotIcon from '@/assets/icons/origin-dot.svg'
import carE from '@/assets/images/drive/car/car-e.webp'
import carN from '@/assets/images/drive/car/car-n.webp'
import carNE from '@/assets/images/drive/car/car-ne.webp'
import carNW from '@/assets/images/drive/car/car-nw.webp'
import carS from '@/assets/images/drive/car/car-s.webp'
import carSE from '@/assets/images/drive/car/car-se.webp'
import carSW from '@/assets/images/drive/car/car-sw.webp'
import carW from '@/assets/images/drive/car/car-w.webp'
import heartImage from '@/assets/images/drive/map-heart.webp'
import restAreaImage from '@/assets/images/stamp/rest-area.webp'
import type { Coordinate } from '@/types/route'
import { type CarHeading, type Direction, nextCarDirection, steadyDirection } from '@/utils/heading'
import useGlide from '@/hooks/useGlide'
import {
  advanceHint,
  alongOf,
  bearingAlong,
  cumulativeMeters,
  hintFor,
  pathBetween,
  pointAtAlong,
  remainingPath,
  type RouteHint,
  snapToRoute,
} from '@/utils/routeProgress'
import styles from './DriveMap.module.scss'

const APP_KEY: string = import.meta.env.VITE_KAKAO_MAP_KEY ?? ''

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_LEVEL = 4
const FOLLOW_LEVEL = 4

const PIN_Y_ANCHOR = 47.5 / 74

const ROUTE_LINES = [
  { strokeWeight: 20, strokeColor: '#FF8585', strokeOpacity: 0.3 },
  { strokeWeight: 12, strokeColor: '#FFFBFB', strokeOpacity: 1 },
  { strokeWeight: 7, strokeColor: '#FF7F6A', strokeOpacity: 1 },
]

const COMPACT_ROUTE_LINES = [
  { strokeWeight: 8, strokeColor: '#FFFBFB', strokeOpacity: 1 },
  { strokeWeight: 4, strokeColor: '#FF7F6A', strokeOpacity: 1 },
]

const LABEL_Y_ANCHOR = 1.4

// 경로에서 이만큼 안이면 차를 경로 위에 붙인다. 더 멀면(경로를 벗어남) 실제 위치에 둔다
const SNAP_METERS = 300
// 차가 볼 방향은 경로를 따라 이만큼 앞을 보고 정한다 (짧은 꺾임에 흔들리지 않게)
const LOOK_AHEAD_METERS = 60
// 현재 위치 버튼으로 다시 따라가기 시작할 때 부드럽게 옮기는 시간. 그동안은 프레임마다 중심을 덮어쓰지 않는다
const RECENTER_MS = 600

const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude })

// 진행 방향별 차 그림 (8방향). 출발 전 · 방향을 모를 때는 정면(S)
const CAR_BY_DIRECTION: Record<Direction, string> = {
  N: carN,
  NE: carNE,
  E: carE,
  SE: carSE,
  S: carS,
  SW: carSW,
  W: carW,
  NW: carNW,
}

interface DriveMapProps {
  current?: Coordinate | null
  currentMarker?: 'dot' | 'car'
  path?: Coordinate[]
  origin?: Coordinate | null
  destination?: Coordinate | null
  restAreas?: { id: string; name: string; coordinate: Coordinate }[]
  onRestAreaClick?: (restAreaId: string) => void
  fitPadding?: [number, number, number, number]
  locateKey?: number
  follow?: boolean
  compact?: boolean
}

function KakaoDriveMap({
  current = null,
  currentMarker = 'dot',
  path = [],
  origin,
  destination,
  restAreas = [],
  onRestAreaClick,
  fitPadding = [40, 40, 40, 40],
  locateKey = 0,
  compact = false,
  follow = false,
}: DriveMapProps) {
  const [loading, error] = useKakaoLoader({ appkey: APP_KEY })
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [initialCenter] = useState(() => (current ? toLatLng(current) : DEFAULT_CENTER))
  const hasPath = path.length > 1
  const [top, right, bottom, left] = fitPadding
  // 움직인 쪽을 보는 차 그림. 거의 안 움직이면(GPS 흔들림) 이전 방향을 유지한다 (경로를 벗어났을 때 씀)
  const [heading, setHeading] = useState<CarHeading>({ anchor: null, direction: 'S' })
  if (current && current !== heading.anchor) {
    const next = nextCarDirection(heading, current)
    if (next !== heading) setHeading(next)
  }

  // 주행 중에는 차를 경로 위에 붙이고, 지나간 구간의 경로선은 지운다.
  // 기준 구간(hint)은 앞으로만 늘어나 GPS가 뒤로 튀어도 되돌아가지 않고, 경로가 바뀌면 처음부터 다시 센다
  const [routeHint, setRouteHint] = useState<RouteHint>({ path, segment: 0 })
  const hint = hintFor(routeHint, path)
  const snapping = currentMarker === 'car' && hasPath && current !== null
  const snap = useMemo(() => (snapping && current ? snapToRoute(path, current, hint) : null), [snapping, path, current, hint])
  const onRoute = snap !== null && snap.offRouteMeters <= SNAP_METERS
  const nextHint = advanceHint(routeHint, path, onRoute ? snap : null)
  if (nextHint !== routeHint) setRouteHint(nextHint)
  // 위치는 띄엄띄엄(시연 0.3초 · GPS 약 1초) 오므로, 차는 경로를 따라 다음 위치까지 프레임마다 이어서 움직인다
  const cumulative = useMemo(() => (snapping ? cumulativeMeters(path) : []), [snapping, path])
  const targetAlong = onRoute && snap ? alongOf(path, cumulative, snap) : null
  const glidedAlong = useGlide(targetAlong)
  const glided = onRoute && glidedAlong !== null ? pointAtAlong(path, cumulative, glidedAlong) : null
  // 경로에 막 붙은 첫 프레임에는 이어 움직일 값이 아직 없다. 그때도 도로 옆 실제 위치가 아니라 경로 위 지점에 둔다
  const carPosition = glided?.point ?? (onRoute && snap ? snap.point : current)
  // 경로 위에서는 앞을 내다본 방향을 쓰되, 경계 근처에서 두 그림을 오가지 않게 크게 꺾일 때만 바꾼다.
  // 도착지에 닿아 앞이 없으면 방향을 그대로 둔다 (북쪽으로 돌지 않게)
  const [routeDirection, setRouteDirection] = useState<Direction>('S')
  const along = glidedAlong ?? targetAlong
  if (onRoute && along !== null) {
    const bearing = bearingAlong(path, cumulative, along, LOOK_AHEAD_METERS)
    const next = bearing === null ? routeDirection : steadyDirection(routeDirection, bearing)
    if (next !== routeDirection) setRouteDirection(next)
  }
  const carDirection: Direction = onRoute ? routeDirection : heading.direction
  // 움직이는 차와, 마지막으로 받은 위치에서 시작하는 경로선 사이를 잇는 짧은 선 (이것만 프레임마다 다시 그린다)
  const connector = useMemo(
    () =>
      glidedAlong !== null && targetAlong !== null
        ? pathBetween(path, cumulative, glidedAlong, targetAlong).map(toLatLng)
        : [],
    [path, cumulative, glidedAlong, targetAlong],
  )
  const visiblePath = useMemo(() => (onRoute && snap ? remainingPath(path, snap) : path), [onRoute, snap, path])

  // 지도를 끌거나 확대하는 동안에는 경로선 · 연결선을 다시 그리지 않고 지도 중심도 옮기지 않는다.
  // 그 사이에 다시 그리면 경로선이 어긋나 보인다
  const [frozen, setFrozen] = useState<{ route: Coordinate[]; connector: typeof connector } | null>(null)
  const freeze = () => setFrozen((prev) => prev ?? { route: visiblePath, connector })
  const unfreeze = () => setFrozen(null)
  const drawnPath = frozen?.route ?? visiblePath
  const drawnConnector = frozen?.connector ?? connector
  const routePath = useMemo(() => drawnPath.map(toLatLng), [drawnPath])
  const lines = compact ? COMPACT_ROUTE_LINES : ROUTE_LINES

  useEffect(() => {
    if (!map || !hasPath || follow) return
    const bounds = new kakao.maps.LatLngBounds()
    for (const point of path) bounds.extend(new kakao.maps.LatLng(point.latitude, point.longitude))
    map.setBounds(bounds, top, right, bottom, left)
  }, [map, path, hasPath, top, right, bottom, left, follow])

  useEffect(() => {
    if (map && follow) map.setLevel(FOLLOW_LEVEL)
  }, [map, follow])

  const [following, setFollowing] = useState(true)
  const [prevLocateKey, setPrevLocateKey] = useState(locateKey)
  if (locateKey !== prevLocateKey) {
    setPrevLocateKey(locateKey)
    setFollowing(true)
  }
  const tracking = follow && following

  const lat = carPosition?.latitude
  const lng = carPosition?.longitude
  const interacting = frozen !== null
  // 현재 위치 버튼을 누르면 한 번은 부드럽게 옮기고, 그동안은 프레임마다 중심을 덮어쓰지 않는다
  const recenter = useRef({ locateKey, until: 0 })
  useEffect(() => {
    if (!map || lat === undefined || lng === undefined || interacting) return
    if (follow ? !tracking : hasPath && locateKey === 0) return
    const center = new kakao.maps.LatLng(lat, lng)
    if (!tracking) {
      map.panTo(center)
      return
    }
    const now = performance.now()
    if (recenter.current.locateKey !== locateKey) {
      recenter.current = { locateKey, until: now + RECENTER_MS }
      map.panTo(center)
      return
    }
    // 따라가는 중에는 차가 프레임마다 움직이므로 애니메이션 없이 중심만 옮긴다
    if (now >= recenter.current.until) map.setCenter(center)
  }, [map, lat, lng, hasPath, locateKey, follow, tracking, interacting])

  if (error) return <div className={styles.fallback}>지도를 불러오지 못했어요.</div>
  if (loading) return <div className={styles.map} aria-busy="true" />

  return (
    <Map
      className={[styles.map, compact && styles.compact].filter(Boolean).join(' ')}
      center={initialCenter}
      level={DEFAULT_LEVEL}
      draggable={!compact}
      zoomable={!compact}
      disableDoubleClickZoom={compact}
      onCreate={setMap}
      onDragStart={() => {
        if (follow) setFollowing(false)
        freeze()
      }}
      onDragEnd={unfreeze}
      onZoomStart={freeze}
      onZoomChanged={unfreeze}
      // 최대 · 최소 배율에서 더 확대하면 zoom_start만 오고 zoom_changed가 오지 않는다. 움직임이 끝나면(idle) 항상 푼다
      onIdle={unfreeze}
    >
      {drawnPath.length > 1 &&
        lines.map((line) => <Polyline key={line.strokeWeight} path={routePath} {...line} />)}
      {drawnConnector.length > 1 &&
        lines.map((line) => <Polyline key={`connector-${line.strokeWeight}`} path={drawnConnector} {...line} />)}
      {origin && (
        <CustomOverlayMap position={toLatLng(origin)}>
          <img className={styles.origin} src={originDotIcon} alt="" />
        </CustomOverlayMap>
      )}
      {restAreas.map((area) => (
        <CustomOverlayMap key={area.id} position={toLatLng(area.coordinate)} clickable>
          <button
            type="button"
            className={styles.restArea}
            onClick={() => onRestAreaClick?.(area.id)}
            aria-label={`${area.name} 상세 보기`}
          >
            <img src={restAreaImage} alt="" />
          </button>
        </CustomOverlayMap>
      ))}
      {destination && (
        <CustomOverlayMap position={toLatLng(destination)} yAnchor={PIN_Y_ANCHOR}>
          <img className={styles.pin} src={mapPinIcon} alt="" />
        </CustomOverlayMap>
      )}
      {compact &&
        [
          { point: origin, text: '출발지' },
          { point: destination, text: '도착지' },
        ].map(
          ({ point, text }) =>
            point && (
              <CustomOverlayMap key={text} position={toLatLng(point)} yAnchor={LABEL_Y_ANCHOR}>
                <span className={styles.label}>
                  <img src={mapLabelIcon} alt="" />
                  <span>{text}</span>
                </span>
              </CustomOverlayMap>
            ),
        )}
      {carPosition && (
        <CustomOverlayMap position={toLatLng(carPosition)}>
          {currentMarker === 'car' ? (
            <span className={styles.carMarker}>
              <img className={styles.car} src={CAR_BY_DIRECTION[carDirection]} alt="" data-direction={carDirection} />
              <img className={styles.heart} src={heartImage} alt="" />
            </span>
          ) : (
            <img className={styles.current} src={currentLocationIcon} alt="" />
          )}
        </CustomOverlayMap>
      )}
    </Map>
  )
}

function DriveMap(props: DriveMapProps) {
  if (!APP_KEY) {
    return (
      <div className={styles.placeholder}>
        <img className={styles.current} src={currentLocationIcon} alt="" />
      </div>
    )
  }
  return <KakaoDriveMap {...props} />
}

export default DriveMap
