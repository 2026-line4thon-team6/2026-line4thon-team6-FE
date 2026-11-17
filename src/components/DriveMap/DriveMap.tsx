import { useEffect, useState } from 'react'
import { CustomOverlayMap, Map, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import currentLocationIcon from '@/assets/icons/current-location.svg'
import mapLabelIcon from '@/assets/icons/map-label.svg'
import mapPinIcon from '@/assets/icons/map-pin.svg'
import originDotIcon from '@/assets/icons/origin-dot.svg'
import carImage from '@/assets/images/drive/map-car.webp'
import heartImage from '@/assets/images/drive/map-heart.webp'
import restAreaImage from '@/assets/images/stamp/rest-area.webp'
import type { Coordinate } from '@/types/route'
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

const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude })

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
  // 주행 중: 경로 전체 대신 내 위치(붕붕이)를 확대해 따라간다
  follow?: boolean
  // 장소 상세처럼 작은 미리보기: 움직일 수 없고, 표시를 작게 하고 출발지 · 도착지 말풍선을 단다
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

  useEffect(() => {
    if (!map || !hasPath || follow) return
    const bounds = new kakao.maps.LatLngBounds()
    for (const point of path) bounds.extend(new kakao.maps.LatLng(point.latitude, point.longitude))
    map.setBounds(bounds, top, right, bottom, left)
  }, [map, path, hasPath, top, right, bottom, left, follow])

  useEffect(() => {
    if (map && follow) map.setLevel(FOLLOW_LEVEL)
  }, [map, follow])

  // 지도를 직접 끌면 따라가기를 멈추고, 현재 위치 버튼(locateKey)을 누르면 다시 따라간다
  const [following, setFollowing] = useState(true)
  const [prevLocateKey, setPrevLocateKey] = useState(locateKey)
  if (locateKey !== prevLocateKey) {
    setPrevLocateKey(locateKey)
    setFollowing(true)
  }
  const tracking = follow && following

  const lat = current?.latitude
  const lng = current?.longitude
  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return
    if (follow ? !tracking : hasPath && locateKey === 0) return
    map.panTo(new kakao.maps.LatLng(lat, lng))
  }, [map, lat, lng, hasPath, locateKey, follow, tracking])

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
      onDragStart={() => follow && setFollowing(false)}
    >
      {hasPath &&
        (compact ? COMPACT_ROUTE_LINES : ROUTE_LINES).map((line) => (
          <Polyline key={line.strokeWeight} path={path.map(toLatLng)} {...line} />
        ))}
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
      {current && (
        <CustomOverlayMap position={toLatLng(current)}>
          {currentMarker === 'car' ? (
            <span className={styles.carMarker}>
              <img className={styles.car} src={carImage} alt="" />
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
